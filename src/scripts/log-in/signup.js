document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const submitButton = document.getElementById('send-code-button');
    const emailField = document.getElementById('email');
    const usernameField = document.getElementById('username');
    const passwordRequirements = document.querySelector('.password-requirements');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // 처음에는 오류 메시지를 숨김
    passwordError.style.display = "none";
    confirmPasswordError.style.display = "none";

    // 비밀번호 유효성 검사 함수
    function validatePassword() {
        const password = passwordField.value;
        const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[+\-*/=.,:;`@!#$%?~^()\[\]{}]).{10,}$/;
        
        if (!passwordPattern.test(password)) {
            if (password.length > 0) { // 비밀번호가 입력되기 시작했을 때만 표시
                passwordError.style.display = "block";
            }
            return false;
        } else {
            passwordError.style.display = "none";
            return true;
        }
    }

    // 비밀번호 확인
    function checkPasswordMatch() {
        if (passwordField.value !== confirmPasswordField.value) {
            if (confirmPasswordField.value.length > 0) { // 확인 비밀번호가 입력되기 시작했을 때만 표시
                confirmPasswordError.style.display = "block";
            }
            return false;
        } else {
            confirmPasswordError.style.display = "none";
            return true;
        }
    }

    // 폼 유효성 검사
    function checkFormValidity() {
        const isPasswordValid = validatePassword();
        const isPasswordMatch = checkPasswordMatch();
        return isPasswordValid && isPasswordMatch;
    }

    // "계정 만들기" 버튼 클릭 이벤트
    submitButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const email = emailField.value;
        const username = usernameField.value;
        const password = passwordField.value;

        // 비밀번호 유효성 체크
        if (!checkFormValidity()) {
            alert('비밀번호 조건을 충족해야 합니다.');
            return;
        }

        try {
            const response = await fetch('/send-verification-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });

            const data = await response.json();
            if (data.success) {
                window.location.href = `verify-email.html?email=${encodeURIComponent(email)}`;
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error sending verification code:', error);
            alert('서버 오류가 발생했습니다.');
        }
    });

    // 실시간 비밀번호 검증
    passwordField.addEventListener('input', validatePassword);
    confirmPasswordField.addEventListener('input', checkPasswordMatch);
});
