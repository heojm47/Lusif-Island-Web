const fetchUsername = async () => {
    // 로그인 상태 확인
    const response = await fetch('/api/get-username');
    if (response.ok) {
        const data = await response.json();
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `${data.username}님 환영합니다!`;
            welcomeMessage.style.display = 'inline';
        }
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout').style.display = 'block';
        document.querySelector('.signup-button').style.display = 'none';
        document.querySelector('.divider').style.display = 'inline';
        document.getElementById('mypage-button').style.display = 'inline-block';
    } else {
        // 로그인하지 않은 경우 UI를 기본 상태로 설정
        console.log('로그인 필요');
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        document.getElementById('logout').style.display = 'none';
        document.getElementById('login-button').style.display = 'block';
        document.querySelector('.signup-button').style.display = 'block';
        document.querySelector('.divider').style.display = 'none';
        document.getElementById('mypage-button').style.display = 'none';
    }
};

fetchUsername();

document.addEventListener('DOMContentLoaded', () => {
    // 로그아웃 버튼 클릭 이벤트 처리
    document.getElementById('logout')?.addEventListener('click', (event) => {
        event.preventDefault(); // 기본 동작 방지
        fetch('/logout', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    // 로그아웃 성공 시 UI 업데이트
                    document.getElementById('welcome-message').style.display = 'none'; // 환영 메시지 숨기기
                    document.getElementById('logout').style.display = 'none'; // 로그아웃 버튼 숨기기
                    document.getElementById('login-button').style.display = 'block'; // 로그인 버튼 보이기
                    document.querySelector('.signup-button').style.display = 'block'; // 회원가입 버튼 보이기
                    document.querySelector('.divider').style.display = 'none';
                    
                    // 마이페이지 버튼 숨기기
                    document.getElementById('mypage-button').style.display = 'none';
                    document.getElementById('admin-dashboard-button').style.display = 'none';
                } else {
                    alert('로그아웃 중 문제가 발생했습니다.');
                }
            })
            .catch(error => {
                console.error('로그아웃 중 오류 발생:', error);
            });
    });
});


