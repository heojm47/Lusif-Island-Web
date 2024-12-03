document.addEventListener('DOMContentLoaded', async () => {
    // 사용자 이름 가져오기 API 호출
    const response = await fetch('/api/get-username');
    
    if (response.ok) {
        const data = await response.json();
        const username = data.username;

        // 사용자 역할 확인 API 호출
        const roleResponse = await fetch('/check-admin');
        
        if (roleResponse.ok) {
            // 관리자일 경우 버튼 표시
            document.getElementById('admin-dashboard-button').style.display = 'inline';
            document.getElementById('admin-dashboard-button').addEventListener('click', () => {
                window.location.href = '/src/pages/admin/admin_dashboard.html'; // 관리자 대시보드로 이동
            });
        }
    } else {
        // 로그인하지 않은 경우 관리자 버튼 숨기기
        console.log('로그인 필요 또는 권한 없음');
        document.getElementById('admin-dashboard-button').style.display = 'none';
    }
});