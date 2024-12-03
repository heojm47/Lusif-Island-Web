document.addEventListener('DOMContentLoaded', () => {
    // URL에서 이메일 주소 가져오기
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
document.getElementById('email-info').textContent = `${email} 이메일 주소로 전송된 코드를 입력해 주세요.`;

// 인증 코드 입력 자동 이동 및 백스페이스 처리
const codeInputs = document.querySelectorAll('.code-input');

codeInputs.forEach((input, index) => {
    input.addEventListener('input', (event) => {
        if (event.inputType === 'insertText' && input.value.length === 1) {
            if (index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        }
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace') {
            if (input.value === '') {
                if (index > 0) {
                    codeInputs[index - 1].focus();
                }
            } else {
                input.value = '';
            }
        }
    });
});

// 인증 코드 확인 버튼 클릭 이벤트
document.getElementById('verify-button').addEventListener('click', async () => {
    const code = Array.from(codeInputs).map(input => input.value).join('');

    try {
        const response = await fetch('/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();
        if (data.success) {
            // 인증이 성공하면 signup-complete.html로 이동하며 이메일을 URL 파라미터로 전달
            window.location.href = `signup-complete.html?email=${encodeURIComponent(email)}`;
        } else {
            alert(data.message || '인증 코드가 잘못되었습니다.');
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        alert('서버 오류가 발생했습니다.');
    }
});
});
