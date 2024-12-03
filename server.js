const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const verificationCodes = {}; // 이메일별 인증 코드 임시 저장소
const nodemailer = require('nodemailer');
const multer = require('multer'); //
const verificationData = {}; // 사용자 정보 임시 저장소
const app = express();
const PORT = 8080;
const fs = require('fs'); // 새로 추가한 코드 
const cors = require("cors"); // 11.30 수정,추가
app.use(cors()); //11.30 수정,추가

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); //(11.29 추가)

// 새로 추가한 코드
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}



// 파일 저장 경로와 이름 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 파일 저장 경로
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 업로드 인스턴스 생성
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB 제한
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원되지 않는 파일 형식입니다.'));
        }
    }
});

// 세션 미들웨어 추가
app.use(session({
    secret: 'a9!f8#h1b@d%4e^g&h7j1l3*', // 비밀키를 설정합니다.
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// JSON 요청 본문을 처리하기 위한 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname))); // 프로젝트의 모든 파일 서빙
app.use('/uploads', express.static('uploads'));

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'rkdtldnjs11@gmail.com', // 본인의 Gmail 주소
        pass: 'fybh qpzl aiev sxis'    // Gmail에서 생성한 앱 비밀번호
    }
});
// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345', // 본인의 MySQL 비밀번호
    database: 'main_DB'
});

// MySQL 연결
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// 이메일 중복 확인 API
app.post('/check-email', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM customers WHERE email = ?';

    connection.query(query, [email], (error, results) => {
        if (error) {
            console.error('Error checking email:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        res.json({ isDuplicate: results.length > 0 });
    });
});

// 회원가입 라우트
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const checkQuery = 'SELECT * FROM customers WHERE email = ?';
    
    connection.query(checkQuery, [email], (error, results) => {
        if (error) {
            console.error('Error checking email during signup:', error);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            return res.status(400).send('이미 사용 중인 이메일입니다.');
        }

        const insertQuery = 'INSERT INTO customers (name, email, password) VALUES (?, ?, ?)';
        connection.query(insertQuery, [username, email, password], (error) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).send('Database error');
            }
            res.redirect('../log-in/log-in.html');
        });
    });
});

// 로그인 라우트 (이미 포함된 코드) - (수정한 코드!!)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM customers WHERE email = ?';

    connection.query(query, [email], (error, results) => {
        if (error) {
            console.error('로그인 중 데이터베이스 오류:', error);
            return res.status(500).send('서버 오류');
        }

        if (results.length > 0) {
            const user = results[0];
            if (password === user.password) {
                req.session.email = user.email; // 세션에 이메일 저장
                req.session.username = user.name; // 사용자 이름 저장
                req.session.role = user.role; // 사용자 역할 저장
                console.log('로그인 성공:', user);
                return res.status(200).json({ success: true, message: '로그인 성공' });
            }
        }
        res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    });
});

// 사용자 이름 가져오기 라우트 수정
app.get('/api/get-username', (req, res) => {
    if (req.session.email) {
        res.json({ 
            username: req.session.username,
            email: req.session.email  // 이메일도 함께 반환
        });
    } else {
        res.status(401).json({ message: '로그인 필요' });
    }
});

// 로그아웃 라우트
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
        }
        res.sendStatus(200);
    });
});

// 공지사항 목록 조회 API(추가)
app.get('/api/notices', (req, res) => {
    const { page = 1, limit = 10, searchQuery = "", filterType = "all" } = req.query;
    const offset = (page - 1) * limit;

    // 기본 쿼리 생성
    let query = `
        SELECT SQL_CALC_FOUND_ROWS * 
        FROM Notice 
        WHERE (title LIKE ? OR content LIKE ?)
    `;
    const queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];

    // 필터가 "all"이 아니면 필터 조건 추가
    if (filterType !== "all") {
        query += ` AND type = ?`;
        queryParams.push(filterType);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // 데이터 조회
    connection.query(query, queryParams, (error, results) => {
        if (error) {
            console.error('공지사항 조회 중 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        // 전체 개수 조회
        connection.query('SELECT FOUND_ROWS() as total', (countError, countResults) => {
            if (countError) {
                console.error('총 개수 조회 중 오류:', countError);
                return res.status(500).json({ message: 'Database error' });
            }

            const totalNotices = countResults[0].total;
            res.json({
                data: results,
                total: totalNotices,
                page: parseInt(page),
                totalPages: Math.ceil(totalNotices / limit),
            });
        });
    });
});



// 공지사항 추가 API(추가)
app.post('/api/notices', upload.single('attachment'), (req, res) => {
    console.log('Received POST request to /api/notices');
    console.log('Form Data:', req.body);
    console.log('Uploaded File:', req.file);

    const { title, content, type } = req.body;

    // 업로드된 파일의 원래 이름 저장
    const originalFileName = req.file ? req.file.originalname : null;

    if (!title || !content || !type) {
        console.error('Missing required fields');
        return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const query = 'INSERT INTO Notice (title, content, type, attachment) VALUES (?, ?, ?, ?)';
    connection.query(query, [title, content, type, originalFileName], (error, results) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).send('Database error');
        }
        console.log('Notice added successfully with ID:', results.insertId);
        res.status(201).json({ id: results.insertId });
    });
});






// 공지사항 삭제 API(11.30 수정)
app.delete('/api/notices/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Notice WHERE id = ?';
    
    connection.query(query, [id], (error) => {
        if (error) {
            console.error('Error deleting notice:', error);
            return res.status(500).send('Database error');
        }
        res.sendStatus(204);
    });
});

// 관리자 접근 권한 검사 미들웨어
function isAdmin(req, res, next) {
    console.log("isAdmin 미들웨어 - 세션 역할:", req.session.role);
    
    if (req.session.role === 'admin') {
        return next();
    } else {
        console.log("접근 권한 없음 - 관리자만 접근 가능");
        return res.status(403).send('접근 권한이 없습니다.');
    }
}

// 관리자 대시보드 경로 설정
app.get('/admin-dashboard', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 여부 확인 API
app.get('/check-admin', (req, res) => {
    if (req.session && req.session.role === 'admin') {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

// 기본 라우트 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 공지사항 상세 API(수정)
app.get('/api/notices/:id', (req, res) => {
    const id = req.params.id;

    // id가 null이거나 유효하지 않은 경우 처리
    if (!id || id === 'null') {
        return res.status(400).json({ message: '잘못된 ID입니다.' });
    }

    const query = 'SELECT * FROM Notice WHERE id = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.error('공지사항 조회 중 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            const post = results[0];

            // `author` 기본값 설정
            post.author = post.author || "관리자";

            // 조회수 증가
            const updateViewsQuery = 'UPDATE Notice SET views = views + 1 WHERE id = ?';
            connection.query(updateViewsQuery, [id], (updateError) => {
                if (updateError) {
                    console.error('조회수 업데이트 중 오류:', updateError);
                }
            });

            res.json(post); // 응답 데이터 전송
        } else {
            res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
        }
    });
});



//(11.29 수정,추가)
app.post('/api/notices/:id/increment-views', (req, res) => { 
    const noticeId = req.params.id;

    const query = 'UPDATE Notice SET views = views + 1 WHERE id = ?';
    connection.query(query, [noticeId], (error) => {
        if (error) {
            console.error('조회수 업데이트 중 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }
        res.sendStatus(200);
    });
});



// 공지사항 수정 API (11.30 수정)
// 공지사항 수정 API
app.put('/api/notices/:id', upload.single('attachment'), (req, res) => {
    const { id } = req.params;
    const { title, content, type } = req.body;
    const attachment = req.file ? req.file.originalname : null;

    if (!title || !content || !type) {
        return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const query = attachment
        ? 'UPDATE Notice SET title = ?, content = ?, type = ?, attachment = ? WHERE id = ?'
        : 'UPDATE Notice SET title = ?, content = ?, type = ? WHERE id = ?';

    const params = attachment ? [title, content, type, attachment, id] : [title, content, type, id];

    connection.query(query, params, (error) => {
        if (error) {
            console.error('Error updating notice:', error);
            return res.status(500).send('Database error');
        }
        res.status(200).json({ message: '공지사항이 성공적으로 수정되었습니다.' });
    });
});


// 업데이트 목록 조회 API(추가)
app.get('/api/updates', (req, res) => {
    const { page = 1, limit = 10, searchQuery = "", filterType = "all" } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT SQL_CALC_FOUND_ROWS * FROM Updates WHERE title LIKE ? OR content LIKE ?';
    const queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];

    if (filterType !== "all") {
        query += ' AND type = ?';
        queryParams.push(filterType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    connection.query(query, queryParams, (error, results) => {
        if (error) {
            console.error('Error fetching updates:', error);
            return res.status(500).send('Database error');
        }

        // 총 개수를 가져오기 위해 FOUND_ROWS() 실행
        connection.query('SELECT FOUND_ROWS() as total', (countError, countResults) => {
            if (countError) {
                console.error('Error fetching total count:', countError);
                return res.status(500).send('Database error');
            }

            const totalUpdates = countResults[0].total;
            res.json({
                data: results,
                total: totalUpdates,
                page: parseInt(page),
                totalPages: Math.ceil(totalUpdates / limit),
            });
        });
    });
});




// 업데이트 글 작성 API (추가)
app.post('/api/updates', upload.single('attachment'), (req, res) => {
    const { title, content, type } = req.body;
    const attachmentPath = req.file ? req.file.path : null; // 파일이 있을 경우 파일 경로 저장

    if (!title || !content || !type) {
        return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const query = 'INSERT INTO Updates (title, content, type, attachment, views) VALUES (?, ?, ?, ?, 0)';
    connection.query(query, [title, content, type, attachmentPath], (error, results) => {
        if (error) {
            console.error('Error adding update:', error);
            return res.status(500).send('Database error');
        }
        res.status(201).json({ id: results.insertId }); // 성공적으로 등록되면 201 응답 반환
    });
});




// 업데이트 상세 API(11.29 수정)
app.get('/api/updates/:id', (req, res) => {
    const updateId = req.params.id;
    const query = 'SELECT title, type, views, created_at, content, attachment FROM Updates WHERE id = ?';

    connection.query(query, [updateId], (error, results) => {
        if (error) {
            console.error('Error fetching update:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            const updateData = results[0];

            // 조회수 증가
            const updateViewsQuery = 'UPDATE Updates SET views = views + 1 WHERE id = ?';
            connection.query(updateViewsQuery, [updateId], (updateError) => {
                if (updateError) {
                    console.error('Error updating views:', updateError);
                }
            });

            // 첨부파일 경로 수정
            if (updateData.attachment) {
                updateData.attachment = `/uploads/${path.basename(updateData.attachment)}`;
            }            
            
            res.json(updateData);
        } else {
            res.status(404).json({ message: 'Update not found' });
        }
    });
});



// 업데이트 수정 API
app.put('/api/updates/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const query = 'UPDATE Updates SET title = ?, content = ? WHERE id = ?';

    connection.query(query, [title, content, id], (error) => {
        if (error) {
            console.error('Error updating update:', error);
            return res.status(500).send('Database error');
        }
        res.sendStatus(200);
    });
});

// 업데이트 삭제 API
app.delete('/api/updates/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Updates WHERE id = ?';

    connection.query(query, [id], (error) => {
        if (error) {
            console.error('Error deleting update:', error);
            return res.status(500).send('Database error');
        }
        res.sendStatus(204);
    });
});
 


// 인증 코드 검증 API
app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    const savedCode = verificationCodes[email];
    const userData = verificationData[email]; // 저장된 사용자 정보 가져오기

    if (savedCode && parseInt(code) === savedCode && userData) { // userData 확인
        delete verificationCodes[email]; // 인증 성공 후 코드 삭제

        const { username, password } = userData;
        const query = 'INSERT INTO customers (name, email, password) VALUES (?, ?, ?)';

        connection.query(query, [username, email, password], (error) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            delete verificationData[email]; // 데이터베이스에 등록 후 임시 저장소에서 제거
            res.json({ success: true, message: '인증이 완료되었고, 회원가입이 완료되었습니다!' });
        });
    } else {
        res.json({ success: false, message: '인증 코드가 올바르지 않습니다.' });
    }
});

app.post('/send-verification-code', (req, res) => {
    const { email, username, password } = req.body; // username과 password 받기
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6자리 인증 코드 생성

    // 로그를 추가하여 데이터가 제대로 들어오는지 확인
    console.log("Received data for verification:", { email, username, password });

    // 이메일별 인증 코드와 사용자 정보 저장
    verificationCodes[email] = verificationCode;
    verificationData[email] = { username, password }; // 사용자 정보 저장

    const mailOptions = {
        from: 'rkdtldnjs11@gmail.com',
        to: email,
        subject: 'Lusif Is Island 인증 코드',
        text: `인증 코드는 ${verificationCode}입니다.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ success: false, message: '인증 코드 전송에 실패했습니다.' });
        } else {
            console.log(`Verification code sent to ${email}: ${verificationCode}`);
            res.json({ success: true, message: '인증 코드가 전송되었습니다.' });
        }
    });
});


// Express.js 서버 코드 예시
app.post('/recover-id', (req, res) => {
    const { username } = req.body;

    const query = 'SELECT email FROM customers WHERE name = ?';
    connection.query(query, [username], (error, results) => {
        if (error) {
            console.error('Error retrieving ID:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length > 0) {
            const email = results[0].email;
            const maskedEmail = email.replace(/(.{3})(.*)(@.*)/, '$1***$3');
            res.json({ success: true, maskedEmail: maskedEmail });
        } else {
            res.json({ success: false });
        }
    });
});




// 인증 코드 확인 API
app.post('/verify-reset-code', (req, res) => {
    const { email, code } = req.body;
    const savedCode = verificationCodes[email];

    if (savedCode && parseInt(code) === savedCode) {
        delete verificationCodes[email]; // 인증 성공 후 코드 삭제
        res.json({ success: true, message: '인증이 완료되었습니다.' });
    } else {
        res.json({ success: false, message: '인증 코드가 올바르지 않습니다.' });
    }
});

// 비밀번호 찾기용 인증 코드 전송 API
app.post('/send-password-reset-code', (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6자리 인증 코드 생성

    // 코드 저장 (추후 검증 시 사용할 수 있도록 메모리 또는 데이터베이스에 저장)
    verificationCodes[email] = verificationCode;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Lusif Is Island 비밀번호 재설정 인증 코드',
        text: `비밀번호 재설정을 위한 인증 코드는 ${verificationCode}입니다.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ success: false, message: '이메일 전송 오류' });
        } else {
            console.log('Verification email sent:', info.response);
            res.json({ success: true, message: '인증 코드가 이메일로 전송되었습니다.' });
        }
    });
});
// 비밀번호 재설정 API
app.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const query = 'UPDATE customers SET password = ? WHERE email = ?';

    connection.query(query, [newPassword, email], (error, results) => {
        if (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ success: false, message: '비밀번호 재설정 실패' });
        } else {
            res.json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
        }
    });
});

// 공지사항 데이터 예시
const notices = [
    { id: 1, type: '공지', title: '새로운 업데이트', content: '업데이트 공지입니다.', created_at: '2024-11-12', views: 10 },
    { id: 2, type: '점검', title: '서버 점검 안내', content: '점검 시간 안내입니다.', created_at: '2024-11-11', views: 20 },
    // 추가 공지사항 데이터
  ];
  
  // 공지사항 API 엔드포인트
  app.get('/api/notices', (req, res) => {
    res.json(notices);
  });


// 문의 데이터 저장 API 
app.post('/api/submit-inquiry', upload.single('attachment'), (req, res) => {
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { email, game, inquiryType, subject, content } = req.body;
    // 첨부파일이 있는 경우에만 경로 설정
    const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
        INSERT INTO inquiries (email, game_info, inquiry_type, title, content, attachment_path)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(query, [email, game, inquiryType, subject, content, attachmentPath], (error, results) => {
        if (error) {
            console.error('문의 데이터 저장 중 오류:', error);
            return res.status(500).json({ success: false, message: '문의 저장 실패' });
        }

        console.log('문의 데이터가 성공적으로 저장되었습니다.');
        res.json({ success: true, message: '문의가 성공적으로 저장되었습니다.' });
    });
});


// 특정 사용자의 문의 내역 조회 API
app.get('/api/inquiries', (req, res) => {
    const email = req.session.email; // 세션에서 이메일 가져오기

    if (!email) {
        console.error('세션에 이메일이 없습니다.');
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const query = `
        SELECT id, game_info, inquiry_type, title, created_at, status 
        FROM inquiries 
        WHERE email = ?
        ORDER BY created_at DESC
    `;

    connection.query(query, [email], (error, inquiries) => {
        if (error) {
            console.error('문의 내역 조회 중 오류:', error);
            return res.status(500).json({ success: false, message: '문의 조회 실패' });
        }

        // 각 문의에 대한 답글 조회
        const inquiryIds = inquiries.map(inquiry => inquiry.id);
        if (inquiryIds.length === 0) {
            return res.json({ success: true, inquiries }); // 문의가 없으면 바로 반환
        }

        const replyQuery = `
            SELECT inquiry_id, content 
            FROM replies 
            WHERE inquiry_id IN (?)
        `;

        connection.query(replyQuery, [inquiryIds], (error, replies) => {
            if (error) {
                console.error('답글 조회 중 오류:', error);
                return res.status(500).json({ success: false, message: '답글 조회 실패' });
            }

            // 각 문의에 답글 추가
            inquiries.forEach(inquiry => {
                inquiry.replies = replies.filter(reply => reply.inquiry_id === inquiry.id);
            });

            res.json({ success: true, inquiries });
        });
    });
});

// 모든 문의 내역 조회 API
app.get('/api/all-inquiries', (req, res) => {
    const query = `
        SELECT id, email, game_info, inquiry_type, title, content, created_at, status, attachment_path
        FROM inquiries 
        ORDER BY created_at DESC
    `;

    connection.query(query, (error, results) => {
        if (error) {
            console.error('모든 문의 내역 조회 중 오류:', error);
            return res.status(500).json({ success: false, message: '문의 조회 실패' });
        }
        console.log('문의 내역:', results);
        res.json({ success: true, inquiries: results });
    });
});


// 특정 문의에 대한 답글 조회 API
app.get('/api/replies/:inquiryId', (req, res) => {
    const inquiryId = req.params.inquiryId;

    const query = `
        SELECT id, content 
        FROM replies 
        WHERE inquiry_id = ?
    `;

    connection.query(query, [inquiryId], (error, results) => {
        if (error) {
            console.error('답글 조회 중 오류:', error);
            return res.status(500).json({ success: false, message: '답글 조회 실패' });
        }
        res.json({ success: true, replies: results });
    });
});

// 답글 저장 API
app.post('/api/reply-inquiry', (req, res) => {
    const { inquiryId, replyContent } = req.body;

    const query = `
        INSERT INTO replies (inquiry_id, content) 
        VALUES (?, ?)
    `;

    connection.query(query, [inquiryId, replyContent], (error) => {
        if (error) {
            console.error('답글 저장 중 오류:', error);
            return res.status(500).json({ success: false, message: '답글 저장 실패' });
        }
        res.json({ success: true, message: '답글이 성공적으로 저장되었습니다.' });
    });
});

// 답글 수정 API
app.put('/api/reply-inquiry/:id', (req, res) => {
    const replyId = req.params.id;
    const { content } = req.body;

    const query = `
        UPDATE replies 
        SET content = ? 
        WHERE id = ?
    `;

    connection.query(query, [content, replyId], (error) => {
        if (error) {
            console.error('답글 수정 중 오류:', error);
            return res.status(500).json({ success: false, message: '답글 수정 실패' });
        }
        res.json({ success: true, message: '답글이 성공적으로 수정되었습니다.' });
    });
});

// 답글 삭제 API
app.delete('/api/reply-inquiry/:id', (req, res) => {
    const replyId = req.params.id;

    const query = `
        DELETE FROM replies 
        WHERE id = ?
    `;

    connection.query(query, [replyId], (error) => {
        if (error) {
            console.error('답글 삭제 중 오류:', error);
            return res.status(500).json({ success: false, message: '답글 삭제 실패' });
        }
        res.json({ success: true, message: '답글이 성공적으로 삭제되었습니다.' });
    });
});

// 문의 상태 업데이트 API
app.put('/api/update-inquiry-status/:id', (req, res) => {
    const inquiryId = req.params.id;
    const { status } = req.body;

    const query = `
        UPDATE inquiries 
        SET status = ? 
        WHERE id = ?
    `;

    connection.query(query, [status, inquiryId], (error) => {
        if (error) {
            console.error('상태 업데이트 중 오류:', error);
            return res.status(500).json({ success: false, message: '상태 업데이트 실패' });
        }
        res.json({ success: true, message: '상태가 성공적으로 업데이트되었습니다.' });
    });
});


// 사용자 목록 조회 API
app.get('/api/users', (req, res) => {
    const query = 'SELECT id, name, email, created_at FROM customers'; // 필요한 필드만 선택
    connection.query(query, (error, results) => {
        if (error) {
            console.error('사용자 목록 조회 중 오류:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, users: results });
    });
});


// 사용자 삭제 API
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id; // URL 파라미터에서 사용자 ID 가져오기
    const query = 'DELETE FROM customers WHERE id = ?';

    connection.query(query, [userId], (error) => {
        if (error) {
            console.error('사용자 삭제 중 오류:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: '사용자가 성공적으로 정지되었습니다.' });
    });
});

// 사용자 비밀번호 변경 API
app.put('/api/users/:id/password', (req, res) => {
    const userId = req.params.id; // URL 파라미터에서 사용자 ID 가져오기
    const { newPassword } = req.body; // 요청 본문에서 새 비밀번호 가져오기

    const query = 'UPDATE customers SET password = ? WHERE id = ?';

    connection.query(query, [newPassword, userId], (error) => {
        if (error) {
            console.error('비밀번호 변경 중 오류:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    });
});



// 비밀번호 확인 API (새로 넣은 코드!!)
app.post('/verify-password', (req, res) => {
    const { password } = req.body;
    const email = req.session.email;

    if (!email) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const query = 'SELECT password FROM customers WHERE email = ?';
    connection.query(query, [email], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }

        if (results.length > 0 && results[0].password === password) {
            return res.json({ success: true, message: '비밀번호 확인 성공' });
        } else {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }
    });
});



// 개인정보 변경 화면 데이터 반환 API(새로 넣은 코드!!)
app.get('/get-profile-info', (req, res) => {
    const email = req.session.email;

    if (!email) {
        console.error('세션 이메일이 설정되어 있지 않습니다.');
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const query = 'SELECT name, email FROM customers WHERE email = ?';
    connection.query(query, [email], (error, results) => {
        if (error) {
            console.error('프로필 정보를 가져오는 중 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }

        if (results.length > 0) {
            return res.json({ success: true, data: results[0] });
        }

        res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
    });
});


app.post('/update-profile', (req, res) => {
    const { username, email } = req.body;

    if (!email || !username) {
        return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
    }

    const query = 'UPDATE customers SET name = ? WHERE email = ?';
    connection.query(query, [username, email], (error) => {
        if (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // 세션에 저장된 닉네임도 갱신
        req.session.username = username;

        res.json({ success: true, message: '닉네임이 성공적으로 변경되었습니다.' });
    });
});


// 비밀번호 변경 API(새로 넣은 코드!!)
app.post('/change-password', (req, res) => {
    const { newPassword } = req.body;
    const email = req.session.email;

    if (!email) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const query = 'UPDATE customers SET password = ? WHERE email = ?';
    connection.query(query, [newPassword, email], (error) => {
        if (error) {
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }

        res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    });
});

// 새로 넣은 코드 !!
app.get('/check-session', (req, res) => {
    console.log('세션 확인:', req.session);
    if (req.session.email) {
        res.json({ success: true, email: req.session.email });
    } else {
        res.json({ success: false, message: '세션이 없습니다.' });
    }
});


// 회원탈퇴 API(새로 넣은 코드!)
app.delete('/delete-account', (req, res) => {
    const email = req.session.email;

    if (!email) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const deleteQuery = 'DELETE FROM customers WHERE email = ?';

    connection.query(deleteQuery, [email], (error, results) => {
        if (error) {
            console.error('Error deleting account:', error);
            return res.status(500).json({ success: false, message: '회원탈퇴 처리 중 오류가 발생했습니다.' });
        }

        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: '세션 종료 중 오류가 발생했습니다.' });
            }

            res.json({ success: true, message: '회원탈퇴가 완료되었습니다.' });
        });
    });
});

// 게시글 목록 조회 API
app.get('/api/posts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'latest';
    const filter = req.query.filter;
    const keyword = req.query.keyword;

    // 정렬 조건 설정
    let orderBy;
    if (sortBy === 'likes') {
        orderBy = 'ORDER BY p.likes DESC, p.created_at DESC';
    } else {
        orderBy = 'ORDER BY p.created_at DESC';
    }

    // 검색 조건 설정
    let searchCondition = '';
    let queryParams = [limit, offset];

    if (keyword) {
        switch (filter) {
            case 'title':
                searchCondition = 'WHERE p.title LIKE ?';
                queryParams = [`%${keyword}%`, limit, offset];
                break;
            case 'content':
                searchCondition = 'WHERE p.content LIKE ?';
                queryParams = [`%${keyword}%`, limit, offset];
                break;
            case 'author':
                searchCondition = 'WHERE c.name LIKE ?';
                queryParams = [`%${keyword}%`, limit, offset];
                break;
        }
    }

    // 게시글 조회 쿼리
    const query = `
        SELECT 
            p.*,
            c.name as author_name,
            COUNT(cm.id) as comment_count
        FROM posts p
        LEFT JOIN customers c ON p.author = c.email
        LEFT JOIN comments cm ON p.id = cm.post_id
        ${searchCondition}
        GROUP BY p.id
        ${orderBy}
        LIMIT ? OFFSET ?
    `;

    // 전체 게시글 수 조회 쿼리
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p
        LEFT JOIN customers c ON p.author = c.email
        ${searchCondition}
    `;

    // 게시글 목록 조회
    connection.query(query, queryParams, (error, posts) => {
        if (error) {
            console.error('게시글 목록 조회 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        // 전체 게시글 수 조회
        const countQueryParams = keyword ? [`%${keyword}%`] : [];
        connection.query(countQuery, countQueryParams, (error, countResult) => {
            if (error) {
                console.error('게시글 수 조회 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            const totalPosts = countResult[0].total;
            const totalPages = Math.ceil(totalPosts / limit);

            res.json({
                posts: posts,
                currentPage: page,
                totalPages: totalPages
            });
        });
    });
});

// 자유게시판 게시글 작성 API
app.post('/api/posts', upload.array('files', 3), (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { title, content } = req.body;
    const files = req.files ? req.files.map(file => file.path) : [];

    const query = `
        INSERT INTO posts (title, content, author, files, created_at, views, likes) 
        VALUES (?, ?, ?, ?, NOW(), 0, 0)
    `;

    connection.query(query, [title, content, req.session.email, JSON.stringify(files)], (error, results) => {
        if (error) {
            console.error('게시글 작성 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({
            message: '게시글이 작성되었습니다.',
            postId: results.insertId
        });
    });
});


// 게시글 상세 조회 API
app.get('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const query = `
        SELECT 
            p.*,
            c2.name as author_name,
            GROUP_CONCAT(
                CASE 
                    WHEN c.id IS NOT NULL THEN
                        JSON_OBJECT(
                            'id', c.id,
                            'content', c.content,
                            'author', c.author,
                            'author_name', (SELECT name FROM customers WHERE email = c.author),
                            'created_at', c.created_at
                        )
                    ELSE NULL
                END
            ) as comments
        FROM posts p
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN customers c2 ON p.author = c2.email
        WHERE p.id = ?
        GROUP BY p.id
    `;

    connection.query(query, [postId], (error, results) => {
        if (error) {
            console.error('게시글 조회 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가
        const updateViewsQuery = 'UPDATE posts SET views = views + 1 WHERE id = ?';
        connection.query(updateViewsQuery, [postId]);

        // 댓글 파싱
        const post = results[0];
        post.comments = post.comments ? JSON.parse(`[${post.comments}]`).filter(comment => comment !== null) : [];

        res.json(post);
    });
});

// 게시글 수정 API
app.put('/api/posts/:id', upload.array('files', 3), (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;
    const { title, content } = req.body;
    const existingFiles = req.body.existingFiles || [];
    const newFiles = req.files ? req.files.map(file => file.path) : [];
    
    // 기존 파일과 새 파일 합치기
    const allFiles = Array.isArray(existingFiles) ? existingFiles.concat(newFiles) : [existingFiles].concat(newFiles);

    // 작성자 또는 관리자 확인
    connection.query('SELECT author FROM posts WHERE id = ?', [postId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        const query = `
            UPDATE posts 
            SET title = ?, content = ?, files = ?
            WHERE id = ?
        `;

        connection.query(query, [title, content, JSON.stringify(allFiles), postId], (error) => {
            if (error) {
                console.error('게시글 수정 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '게시글이 수정되었습니다.' });
        });
    });
});

// 게시글 삭제 API
app.delete('/api/posts/:id', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;

    // 작성자 확인
    connection.query('SELECT author FROM posts WHERE id = ?', [postId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 게시글 삭제
        connection.query('DELETE FROM posts WHERE id = ?', [postId], (error) => {
            if (error) {
                console.error('게시글 삭제 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '게시글이 삭제되었습니다.' });
        });
    });
});

// 댓글 작성 API
app.post('/api/posts/:postId/comments', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.postId;
    const { content } = req.body;

    // 사용자 이름 조회 후 댓글 저장
    connection.query('SELECT name FROM customers WHERE email = ?', [req.session.email], (error, results) => {
        if (error) {
            console.error('사용자 조회 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        const userName = results[0].name;
        const query = `
            INSERT INTO comments (post_id, content, author, created_at)
            VALUES (?, ?, ?, NOW())
        `;

        connection.query(query, [postId, content, req.session.email], (error, results) => {
            if (error) {
                console.error('댓글 작성 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.status(201).json({
                id: results.insertId,
                content,
                author: req.session.email,
                author_name: userName,
                created_at: new Date()
            });
        });
    });
});

// 댓글 삭제 API
app.delete('/api/comments/:id', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const commentId = req.params.id;

    // 댓글 작성자 또는 관리자 확인
    connection.query('SELECT author FROM comments WHERE id = ?', [commentId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 댓글 삭제
        connection.query('DELETE FROM comments WHERE id = ?', [commentId], (error) => {
            if (error) {
                console.error('댓글 삭제 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '댓글이 삭제되었습니다.' });
        });
    });
});

// 게시글 추천 API
app.post('/api/posts/:id/like', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;
    const userEmail = req.session.email;

    // 이미 추천했는지 확인
    connection.query(
        'SELECT * FROM post_likes WHERE post_id = ? AND user_email = ?',
        [postId, userEmail],
        (error, results) => {
            if (error) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: '이미 추천한 게시글입니다.' });
            }

            // 트랜잭션 시작
            connection.beginTransaction(err => {
                if (err) {
                    return res.status(500).json({ message: 'Transaction error' });
                }

                // 추천 기록 추가
                connection.query(
                    'INSERT INTO post_likes (post_id, user_email) VALUES (?, ?)',
                    [postId, userEmail],
                    (error) => {
                        if (error) {
                            return connection.rollback(() => {
                                res.status(500).json({ message: 'Like insert error' });
                            });
                        }

                        // 게시글의 추천 수 증가
                        connection.query(
                            'UPDATE posts SET likes = likes + 1 WHERE id = ?',
                            [postId],
                            (error) => {
                                if (error) {
                                    return connection.rollback(() => {
                                        res.status(500).json({ message: 'Like update error' });
                                    });
                                }

                                connection.commit(err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({ message: 'Commit error' });
                                        });
                                    }
                                    res.json({ message: '추천되었습니다.' });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

//공략 게시글 코드
// 공략 게시글 목록 조회 API
// 게시글 목록 조회 API
app.get('/api/strategy-posts', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 페이지 번호
    const limit = parseInt(req.query.limit) || 10; // 페이지당 게시글 수
    const offset = (page - 1) * limit; // 오프셋 계산
    const category = req.query.category || "all"; // 카테고리 필터
    const searchQuery = req.query.keyword ? `%${req.query.keyword}%` : "%"; // 검색어

    // 카테고리 필터링 조건
    let categoryCondition = "";
    const queryParams = [searchQuery, searchQuery];

    if (category !== "all") {
        categoryCondition = "AND p.category = ?";
        queryParams.push(category);
    }

    queryParams.push(limit, offset); // LIMIT와 OFFSET 추가

    // SQL 쿼리
    const query = `
        SELECT 
            p.*,
            c.name AS author_name,
            COUNT(cm.id) AS comment_count
        FROM strategy_posts p
        LEFT JOIN customers c ON p.author = c.email
        LEFT JOIN strategy_comments cm ON p.id = cm.post_id
        WHERE (p.title LIKE ? OR p.content LIKE ?)
        ${categoryCondition} 
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `;

    // 데이터 조회
    connection.query(query, queryParams, (error, posts) => {
        if (error) {
            console.error("게시글 목록 조회 오류:", error);
            return res.status(500).json({ message: "Database error" });
        }

        // 총 게시글 수 조회
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM strategy_posts p
            WHERE (p.title LIKE ? OR p.content LIKE ?)
            ${category !== "all" ? "AND p.category = ?" : ""}
        `;

        const countParams = [searchQuery, searchQuery];
        if (category !== "all") countParams.push(category);

        connection.query(countQuery, countParams, (countError, countResult) => {
            if (countError) {
                console.error("게시글 수 조회 오류:", countError);
                return res.status(500).json({ message: "Database error" });
            }

            const totalPosts = countResult[0].total;
            const totalPages = Math.ceil(totalPosts / limit);

            res.json({
                posts: posts,
                totalPages: totalPages,
                currentPage: page,
            });
        });
    });
});


// 공략 게시글 작성 API
app.post('/api/strategy-posts', upload.array('files', 3), (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const { title, content, category } = req.body;
    if (!category || !['boss', 'battle', 'ability'].includes(category)) {
        return res.status(400).json({ message: '올바른 카테고리를 선택해주세요.' });
    }

    const files = req.files ? req.files.map(file => file.path) : [];

    const query = `
        INSERT INTO strategy_posts (title, content, category, author, files, created_at, views, likes) 
        VALUES (?, ?, ?, ?, ?, NOW(), 0, 0)
    `;

    connection.query(query, [title, content, category, req.session.email, JSON.stringify(files)], (error, results) => {
        if (error) {
            console.error('게시글 작성 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({
            message: '게시글이 작성되었습니다.',
            postId: results.insertId
        });
    });
});

// 공략 게시글 상세 조회 API
app.get('/api/strategy-posts/:id', (req, res) => {
    const postId = req.params.id;
    const query = `
        SELECT 
            p.*,
            c2.name as author_name,
            GROUP_CONCAT(
                CASE 
                    WHEN c.id IS NOT NULL THEN
                        JSON_OBJECT(
                            'id', c.id,
                            'content', c.content,
                            'author', c.author,
                            'author_name', (SELECT name FROM customers WHERE email = c.author),
                            'created_at', c.created_at
                        )
                    ELSE NULL
                END
            ) as comments
        FROM strategy_posts p
        LEFT JOIN strategy_comments c ON p.id = c.post_id
        LEFT JOIN customers c2 ON p.author = c2.email
        WHERE p.id = ?
        GROUP BY p.id
    `;

    connection.query(query, [postId], (error, results) => {
        if (error) {
            console.error('게시글 조회 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가
        const updateViewsQuery = 'UPDATE strategy_posts SET views = views + 1 WHERE id = ?';
        connection.query(updateViewsQuery, [postId]);

        // 댓글 파싱
        const post = results[0];
        post.comments = post.comments ? JSON.parse(`[${post.comments}]`).filter(comment => comment !== null) : [];

        res.json(post);
    });
});

// 공략 게시글 수정 API
app.put('/api/strategy-posts/:id', upload.array('files', 3), (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;
    const { title, content, category } = req.body;

    // category 기본값 설정
    const validCategories = ['boss', 'battle', 'ability'];
    const updatedCategory = validCategories.includes(category) ? category : 'default';

    const existingFiles = req.body.existingFiles || [];
    const newFiles = req.files ? req.files.map(file => file.path) : [];
    const allFiles = Array.isArray(existingFiles) ? existingFiles.concat(newFiles) : [existingFiles].concat(newFiles);

    // 작성자 또는 관리자 확인
    connection.query('SELECT author FROM strategy_posts WHERE id = ?', [postId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        const query = `
            UPDATE strategy_posts 
            SET title = ?, content = ?, category = ?, files = ?
            WHERE id = ?
        `;

        connection.query(query, [title, content, category, JSON.stringify(allFiles), postId], (error) => {
            if (error) {
                console.error('게시글 수정 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '게시글이 수정되었습니다.' });
        });
    });
});



// 공략 게시글 삭제 API
app.delete('/api/strategy-posts/:id', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;

    // 작성자 또는 관리자 확인
    connection.query('SELECT author FROM strategy_posts WHERE id = ?', [postId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 게시글 삭제
        connection.query('DELETE FROM strategy_posts WHERE id = ?', [postId], (error) => {
            if (error) {
                console.error('게시글 삭제 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '게시글이 삭제되었습니다.' });
        });
    });
});


// 공략 게시글 댓글 작성 API
app.post('/api/strategy-posts/:id/comments', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;
    const { content } = req.body;

    connection.query('SELECT name FROM customers WHERE email = ?', [req.session.email], (error, results) => {
        if (error) {
            console.error('사용자 조회 오류:', error);
            return res.status(500).json({ message: 'Database error' });
        }

        const userName = results[0].name;
        const query = `
            INSERT INTO strategy_comments (post_id, content, author, created_at)
            VALUES (?, ?, ?, NOW())
        `;

        connection.query(query, [postId, content, req.session.email], (error, results) => {
            if (error) {
                console.error('댓글 작성 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.status(201).json({
                id: results.insertId,
                content,
                author: req.session.email,
                author_name: userName,
                created_at: new Date()
            });
        });
    });
});

// 공략 게시글 댓글 삭제 API
app.delete('/api/strategy-comments/:id', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const commentId = req.params.id;

    // 댓글 작성자 또는 관리자 확인
    connection.query('SELECT author FROM strategy_comments WHERE id = ?', [commentId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (results[0].author !== req.session.email && req.session.role !== 'admin') {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 댓글 삭제
        connection.query('DELETE FROM strategy_comments WHERE id = ?', [commentId], (error) => {
            if (error) {
                console.error('댓글 삭제 오류:', error);
                return res.status(500).json({ message: 'Database error' });
            }

            res.json({ message: '댓글이 삭제되었습니다.' });
        });
    });
});

// 공략 게시글 좋아요 API
app.post('/api/strategy-posts/:id/like', (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const postId = req.params.id;
    const userEmail = req.session.email;

    connection.query(
        'SELECT * FROM strategy_likes WHERE post_id = ? AND user_email = ?',
        [postId, userEmail],
        (error, results) => {
            if (error) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: '이미 추천한 게시글입니다.' });
            }

            // 트랜잭션 시작
            connection.beginTransaction(err => {
                if (err) {
                    return res.status(500).json({ message: 'Transaction error' });
                }

                // 추천 기록 추가
                connection.query(
                    'INSERT INTO strategy_likes (post_id, user_email) VALUES (?, ?)',
                    [postId, userEmail],
                    (error) => {
                        if (error) {
                            return connection.rollback(() => {
                                res.status(500).json({ message: 'Like insert error' });
                            });
                        }

                        // 게시글의 추천 수 증가
                        connection.query(
                            'UPDATE strategy_posts SET likes = likes + 1 WHERE id = ?',
                            [postId],
                            (error) => {
                                if (error) {
                                    return connection.rollback(() => {
                                        res.status(500).json({ message: 'Like update error' });
                                    });
                                }

                                connection.commit(err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({ message: 'Commit error' });
                                        });
                                    }
                                    res.json({ message: '추천되었습니다.' });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

//11.30(추가)
app.get('/api/general-posts', (req, res) => { 
    const { page = 1, limit = 10, searchQuery = "" } = req.query;
    const offset = (page - 1) * limit;

    const searchCondition = searchQuery.trim() !== "" ? `WHERE title LIKE ? OR content LIKE ?` : "";
    const queryParams = searchQuery.trim() !== ""
        ? [`%${searchQuery}%`, `%${searchQuery}%`, parseInt(limit), parseInt(offset)]
        : [parseInt(limit), parseInt(offset)];

    const query = `
        SELECT SQL_CALC_FOUND_ROWS * 
        FROM posts 
        ${searchCondition}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `;

    connection.query(query, queryParams, (error, results) => {
        if (error) {
            console.error("자유게시판 목록 조회 중 오류:", error);
            return res.status(500).json({ message: "Database error" });
        }

        connection.query("SELECT FOUND_ROWS() as total", (countError, countResults) => {
            if (countError) {
                console.error("총 게시물 수 조회 중 오류:", countError);
                return res.status(500).json({ message: "Database error" });
            }

            const totalPosts = countResults[0].total;
            res.json({
                data: results,
                total: totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                currentPage: parseInt(page),
            });
        });
    });
});




app.get('/src/pages/community/strategy_view.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/pages/community/strategy_view.html'));
});


//////////////////////////////////관리자 대시보드 방문자 위젯/////////////////////////////////////
//////////////////////////////////작동하려면 scrips.js에도 코드 필요/////////////////////////////////////
// MySQL 테이블 생성 쿼리
const createVisitorsTableQuery = `
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_date DATE NOT NULL,
    count INT DEFAULT 1,
    UNIQUE KEY unique_date (visit_date)
)`;

connection.query(createVisitorsTableQuery);

// 방문자 수 증가 API
app.post('/api/visitors', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const query = `
        INSERT INTO visitors (visit_date, count) 
        VALUES (?, 1) 
        ON DUPLICATE KEY UPDATE count = count + 1`;
    
    connection.query(query, [today], (error) => {
        if (error) {
            console.error('방문자 수 업데이트 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }
        res.json({ message: '방문자 수 업데이트 성공' });
    });
});

// 오늘의 방문자 수 조회 API
app.get('/api/admin/visitors/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const query = 'SELECT count FROM visitors WHERE visit_date = ?';
    
    connection.query(query, [today], (error, results) => {
        if (error) {
            console.error('오늘의 방문자 수 조회 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }
        
        // 오늘 방문자가 없으면 0 반환, 있으면 해당 수 반환
        const count = results.length > 0 ? results[0].count : 0;
        res.json({ count: count });
    });
});

// 최근 7일 방문자 통계 조회 API
app.get('/api/admin/visitors/weekly', (req, res) => {
    const query = `
        SELECT visit_date, count 
        FROM visitors 
        WHERE visit_date > DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND visit_date <= CURDATE()
        ORDER BY visit_date ASC`;
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('방문자 통계 조회 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }

        // 최근 7일 데이터 포맷팅
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // 시간을 00:00:00으로 설정
        
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        // 결과 매핑
        const visitorCounts = last7Days.map(date => {
            const dayData = results.find(r => r.visit_date.toISOString().split('T')[0] === date);
            return dayData ? dayData.count : 0;
        });

        res.json({ visitors: visitorCounts });
    });
});

// 총 회원수 조회 API
app.get('/api/admin/total-users', (req, res) => {
    const query = 'SELECT COUNT(*) as total FROM customers';
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('총 회원수 조회 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }
        
        res.json({ count: results[0].total });
    });
});

// 총 게시글 수 조회 API
app.get('/api/admin/total-posts', (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM posts) + 
            (SELECT COUNT(*) FROM strategy_posts) as total`;
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('총 게시글 수 조회 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }
        
        res.json({ count: results[0].total });
    });
});

// 미답변 문의글 수 조회 API
app.get('/api/admin/pending-inquiries', (req, res) => {
    const query = 'SELECT COUNT(*) as total FROM inquiries WHERE status = "open"';
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('미답변 문의글 수 조회 실패:', error);
            return res.status(500).json({ message: '서버 오류' });
        }
        
        res.json({ count: results[0].total });
    });
});

//////////////////////////////////관리자 대시보드 방문자 위젯/////////////////////////////////////

// 다운로드 엔드포인트 추가
app.get('/download-game', (req, res) => {
    const file = path.join(__dirname, 'game', "Lucif's Island.zip");
    res.download(file, "Lucif's Island.zip", (err) => {
        if (err) {
            console.error('다운로드 중 오류 발생:', err);
            res.status(500).send('다운로드 중 오류가 발생했습니다.');
        }
    });
});


app.get('/api/inquiries/:id', (req, res) => {
    const inquiryId = req.params.id;
    console.log(`Fetching inquiry details for ID: ${inquiryId}`); // 로그 추가

    const query = `
        SELECT 
            i.*, 
            r.content AS reply_content, 
            r.created_at AS reply_created_at
        FROM inquiries i
        LEFT JOIN replies r ON i.id = r.inquiry_id
        WHERE i.id = ?
    `;

    connection.query(query, [inquiryId], (error, results) => {
        if (error) {
            console.error('문의 상세 조회 오류:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            console.log(`No inquiry found for ID: ${inquiryId}`); // 추가 로그
            return res.status(404).json({ success: false, message: '문의 내역을 찾을 수 없습니다.' });
        }

        console.log('Inquiry details:', results[0]); // 결과 확인
        res.json({ success: true, inquiry: results[0] });
    });
});

// 특정 문의에 대한 답변 및 문의 상세 조회 API
app.get("/api/inquiries/:id", (req, res) => {
    const inquiryId = req.params.id;

    const query = `
        SELECT 
            i.*, 
            r.content AS reply_content, 
            r.created_at AS reply_created_at
        FROM inquiries i
        LEFT JOIN replies r ON i.id = r.inquiry_id
        WHERE i.id = ?
    `;

    connection.query(query, [inquiryId], (error, results) => {
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No inquiry found" });
        }

        res.json({ success: true, inquiry: results[0] });
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
