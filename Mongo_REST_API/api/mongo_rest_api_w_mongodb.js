/*
 * mongo_rest_api_w_mongodb.js
 * Y, 2026.3.1 - 2, 3.19 - 20
 */

import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();

// 환경 변수 설정
const MONGO_URI = process.env.MONGO_URI || 'mongodb://host.docker.internal:27017/yControl';
const API_PORT = process.env.API_PORT || 3000;

// 허용된 컬렉션 목록 설정
const rawCollections = process.env.ALLOWED_COLLECTIONS || 'log';
const ALLOWED_COLLECTIONS = rawCollections.split(',').map(item => item.trim());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- 미들웨어: Read-Only 설정 ---
app.use((req, res, next) => {
  // 허용할 메서드 목록
  const allowedMethods = ['GET', 'POST'];

  // 요청받은 메서드가 허용 목록에 없는 경우 차단
  if (!allowedMethods.includes(req.method)) {
    console.log(`[Blocked] ${req.method} request to ${req.url}`);
    return res.status(405).json({ 
      error: 'Method Not Allowed', 
      message: 'This API allows only GET and POST requests.' 
    });
  }
  next(); 
});


// MongoDB 연결
const client = new MongoClient(MONGO_URI);
let db;

async function startServer() {
  try {
    // 1️⃣ DB 먼저 연결
    await client.connect();
    
    // 2️⃣ URI에서 DB명 가져와서 db 변수에 할당
    const connectedDbName = client.options.dbName || 'yControl';
    db = client.db(connectedDbName);
    
    console.log(`✅ MongoDB Connected: ${connectedDbName}`);

    // 3️⃣ DB 연결이 성공한 '후에' 서버 실행
    app.listen(API_PORT, () => {
      console.log(`🚀 API Server running on port ${API_PORT}`);
      console.log(`🔒 Allowed Collections: ${ALLOWED_COLLECTIONS.join(', ')}`);
      console.log(`🛡️ Mode: Read-Only (GET Only)`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(2); // 연결 실패 시 프로세스 종료
  }
}
startServer();


// 날짜 형식의 문자열인지 확인하는 함수
const isIsoDate = (str) => {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) return false;
    return !isNaN(Date.parse(str));
};

// 쿼리 객체를 순회하며 날짜 문자열을 Date 객체로 변환하는 함수
const castToDate = (obj) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string' && isIsoDate(obj[key])) {
            obj[key] = new Date(obj[key]); // 문자열을 실제 날짜 객체로 변환!
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            castToDate(obj[key]); // 재귀적으로 탐색
        }
    }
    return obj;
};


// --- 미들웨어: DB 연결 및 컬렉션 권한 검증 ---
const validateRequest = (req, res, next) => {
  // 1. MongoDB 연결 상태 체크
  if (!client || !db || !client.topology || !client.topology.isConnected()) {
    console.error('❌ MongoDB Connection Error: Database is disconnected.');
    return res.status(503).json({ 
      error: "MongoDB Connection Error", 
      message: "MongoDB 연결이 끊어졌습니다." 
    });
  }

  const { collectionName } = req.params;

  // 2. 허용된 컬렉션인지 검사
  if (!ALLOWED_COLLECTIONS.includes(collectionName)) {
    console.warn(`[Access Denied] ${collectionName}`);
    return res.status(403).json({
      error: "Forbidden",
      message: "접근 권한이 없는 컬렉션입니다."
    });
  }

  // 모든 검증을 통과하면 다음 로직(라우터 핸들러)으로 넘어감
  next();
};


// --- API 라우트 ---
app.get('/api/:collectionName', validateRequest, async (req, res) => {

  try {
    const { collectionName } = req.params;
    const { find, aggregate } = req.query;

    // 1. [보안] 허용된 컬렉션인지 검사
    if (!ALLOWED_COLLECTIONS.includes(collectionName)) {
      console.warn(`[Access Denied] ${collectionName}`);
      return res.status(403).json({   // 403 (Forbidden)
        error: "Forbidden", 
        message: "접근 권한이 없는 컬렉션입니다." 
      });
    }

    let result;
    let applied;

    // 2. 쿼리 파라미터 검증
    const findStr = find ? find.trim() : null;
    const aggStr = aggregate ? aggregate.trim() : null;

    if (!find && !aggregate) {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "find 또는 aggregate 파라미터가 누락되었습니다." 
      });
    }

    if (find && aggregate) {  // 둘 다 데이터가 들어온 경우 (동시 사용 불가)
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "find와 aggregate는 동시에 사용할 수 없습니다. 하나만 선택해 주세요." 
      });
    }

    const rawQueryString = find || aggregate;
    const blacklistedOperators = ['$where', '$accumulator', '$function'];
    if (blacklistedOperators.some(op => rawQueryString.includes(op))) {
      console.warn(`[Security Alert] Blocked request containing: ${rawQueryString}`);
      return res.status(400).json({ error: "Forbidden operator used" });
    }

    // 3. Fetch by find or aggregate
    try {
      if (find) {
        // --- Find 모드 ---
        let query = JSON.parse(find);

        // 쿼리 객체가 비어있는지 체크 (예: {})
        if (Object.keys(query).length === 0) {
          return res.status(400).json({
            status: 400,
            error: "Bad Request (Empty query)",
            message: "find 쿼리가 비어있습니다. 필터 조건을 입력해주세요."
          });
        }

        console.log(`🔎 [${collectionName}] Find:`, JSON.stringify(query));
        query = castToDate(query);
        result = await db.collection(collectionName).find(query).toArray();
        applied = query;

      } else if (aggregate) {
        // --- Aggregate 모드 ---
        let pipeline = JSON.parse(aggregate);
        let finalPipeline = Array.isArray(pipeline) ? pipeline : [pipeline];

        // 파이프라인 배열이 비어있는지 체크
        if (finalPipeline.length === 0) {
          return res.status(400).json({
            status: 400,
            error: "Bad Request (Empty pipeline)",
            message: "aggregate 파이프라인이 비어있습니다."
          });
        }

        console.log(`🔎 [${collectionName}] Aggregate:`, JSON.stringify(finalPipeline));
        finalPipeline = castToDate(finalPipeline);
        result = await db.collection(collectionName).aggregate(finalPipeline).toArray();
        applied = finalPipeline;
      }
      console.log(`📍 [${collectionName}] result:`, result.length);

    } catch (parseErr) {
      // JSON 형식이 잘못되었거나 빈 문자열인 경우 처리
      console.error('❌ JSON Error:', parseErr);
      return res.status(400).json({ 
        status: 400,
        error: "Bad Request (JSON)", 
        message: "유효하지 않은 JSON 형식이거나 빈 값입니다.",
        details: parseErr.message 
      });
    }

    // 3. 결과 응답
    res.json({
      collection: collectionName,
      type: aggregate ? 'aggregate' : 'find',
      count: result.length,
      query: applied,
      data: result
    });

  } catch (err) {
    console.error('❌ Server Error:', err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});


// --- API 라우트: POST 방식 (Body를 통한 쿼리 전달) ---
app.post('/api/:collectionName', validateRequest, async (req, res) => {

  try {
    const { collectionName } = req.params;
    const { find, aggregate } = req.body;

    // 1. [보안] 허용된 컬렉션인지 검사
    if (!ALLOWED_COLLECTIONS.includes(collectionName)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "접근 권한이 없는 컬렉션입니다."
      });
    }

    // 2. Body 데이터 추출 (POST에서는 req.query 대신 req.body 사용)
    if (!find && !aggregate) {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "Body에 find 또는 aggregate 필드가 누락되었습니다." 
      });
    }

    if (find && aggregate) {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "find와 aggregate는 동시에 사용할 수 없습니다." 
      });
    }

    // 보안 검사 (문자열로 변환하여 블랙리스트 체크)
    const queryStr = JSON.stringify(find || aggregate);
    const blacklistedOperators = ['$where', '$accumulator', '$function'];
    if (blacklistedOperators.some(op => queryStr.includes(op))) {
      return res.status(400).json({ error: "Forbidden operator used" });
    }

    let result;
    let applied;

    // 3. 실행 (POST 방식은 이미 Object 형태이므로 JSON.parse가 필요 없음)
    if (find) {
      // Find 모드
      if (Object.keys(find).length === 0) {
        return res.status(400).json({ error: "Empty find object" });
      }
      applied = castToDate({ ...find }); // 원본 보존을 위해 복사본 전달
      result = await db.collection(collectionName).find(applied).toArray();
      
    } else if (aggregate) {
      // Aggregate 모드
      let pipeline = Array.isArray(aggregate) ? aggregate : [aggregate];
      if (pipeline.length === 0) {
        return res.status(400).json({ error: "Empty aggregate pipeline" });
      }
      applied = castToDate([...pipeline]); // 원본 보존을 위해 복사본 전달
      result = await db.collection(collectionName).aggregate(applied).toArray();
    }

    // 4. 결과 응답
    res.json({
      collection: collectionName,
      type: aggregate ? 'aggregate' : 'find',
      count: result.length,
      query: applied,
      data: result
    });

  } catch (err) {
    console.error('❌ Server Error:', err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});
