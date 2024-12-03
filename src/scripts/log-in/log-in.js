document.addEventListener('DOMContentLoaded', () => {
    // 로그인 처리
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
        const formData = new FormData(loginForm);
        const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/public/index.html';
        } else {
            errorMessage.style.display = 'block';
            errorMessage.textContent = '아이디 또는 비밀번호가 틀립니다.';
        }
    })
    .catch(error => {
        console.error('로그인 중 문제가 발생했습니다:', error);
    });
});

// 아이디 찾기 기능
async function recoverId(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const recoveryMessage = document.getElementById('recovery-message');

    try {
        const response = await fetch('/recover-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (data.success) {
            recoveryMessage.textContent = `회원님의 이메일: ${data.maskedEmail}`;
            recoveryMessage.style.color = 'green';
        } else {
            recoveryMessage.textContent = '해당 사용자 이름이 없습니다.';
            recoveryMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('ID 복구 중 문제가 발생했습니다:', error);
        recoveryMessage.textContent = '서버 오류가 발생했습니다. 다시 시도해주세요.';
        recoveryMessage.style.color = 'red';
    }
}

// 비밀번호 찾기: 인증 코드 전송
async function sendPasswordResetCode(event) {
    event.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const message = document.getElementById('password-recovery-message');

    try {
        const response = await fetch('/send-password-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            message.textContent = '인증 코드가 이메일로 전송되었습니다.';
            message.style.color = 'green';
            document.getElementById('code-verification-group').style.display = 'block';
        } else {
            message.textContent = '이메일 전송 실패';
            message.style.color = 'red';
        }
    } catch (error) {
        console.error('Error sending verification code:', error);
        message.textContent = '서버 오류가 발생했습니다. 다시 시도해주세요.';
        message.style.color = 'red';
    }
}

// 비밀번호 찾기: 인증 코드 확인
async function verifyCode() {
    const email = document.getElementById('recovery-email').value;
    const code = document.getElementById('verification-code').value;
    const verificationMessage = document.getElementById('verification-message');

    try {
        const response = await fetch('/verify-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();
        if (data.success) {
            verificationMessage.textContent = '인증이 완료되었습니다.';
            verificationMessage.style.color = 'green';
            document.getElementById('new-password-group').style.display = 'block';
        } else {
            verificationMessage.textContent = '인증 코드가 올바르지 않습니다.';
            verificationMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        verificationMessage.textContent = '서버 오류가 발생했습니다. 다시 시도해주세요.';
        verificationMessage.style.color = 'red';
    }
}

// 비밀번호 재설정
async function resetPassword() {
    const email = document.getElementById('recovery-email').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const verificationMessage = document.getElementById('verification-message');

    if (newPassword !== confirmPassword) {
        verificationMessage.textContent = '비밀번호가 일치하지 않습니다.';
        verificationMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, newPassword })
        });

        const data = await response.json();
        if (data.success) {
            alert('비밀번호가 재설정되었습니다. 다시 로그인하세요.');
            closePasswordRecoveryPopup();
        } else {
            verificationMessage.textContent = '비밀번호 재설정 실패';
            verificationMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        verificationMessage.textContent = '서버 오류가 발생했습니다. 다시 시도해주세요.';
        verificationMessage.style.color = 'red';
    }
}


window.openIdRecoveryPopup = function() {
    document.getElementById('id-recovery-popup').style.display = 'flex';
    document.getElementById('username').value = ''; // 초기화
    document.getElementById('recovery-message').textContent = ''; // 메시지 초기화
};

window.closeIdRecoveryPopup = function() {
    document.getElementById('id-recovery-popup').style.display = 'none';
};

window.openPasswordRecoveryPopup = function() {
    document.getElementById('password-recovery-popup').style.display = 'flex';
    document.getElementById('recovery-email').value = ''; // 초기화
    document.getElementById('password-recovery-message').textContent = ''; // 메시지 초기화
    document.getElementById('code-verification-group').style.display = 'none';
    document.getElementById('new-password-group').style.display = 'none';
    document.getElementById('verification-message').textContent = ''; // 메시지 초기화
};

window.closePasswordRecoveryPopup = function() {
    document.getElementById('password-recovery-popup').style.display = 'none';
};
});
