document.addEventListener('DOMContentLoaded', function() {
    // 방문자 차트 초기화
    initVisitorsChart();
    
    // 대시보드 통계 초기화
    updateDashboardStats();
    
    // 새로고침 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 현재 회전 각도 초기화를 위해 transition 잠시 제거
            this.style.transition = 'none';
            this.style.transform = 'rotate(0deg)';
            
            // 강제로 리플로우 발생
            this.offsetHeight;
            
            // transition 다시 설정하고 회전
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'rotate(360deg)';
            
            // 데이터 업데이트
            updateDashboardStats();
            updateVisitorsData();
        });
    });

    // 위젯 클릭 이벤트 추가
    const statItems = document.querySelectorAll('.stat-item');
    // 총 게시글 위젯 (첫 번째 위젯)
    if (statItems[0]) {
        statItems[0].style.cursor = 'pointer';
        statItems[0].addEventListener('click', () => {
            window.location.href = 'admin_user_management.html';
        });
    }    

    
    // 총 게시글 위젯 (세 번째 위젯)
    if (statItems[2]) {
        statItems[2].style.cursor = 'pointer';
        statItems[2].addEventListener('click', () => {
            window.location.href = 'admin_content_management.html';
        });
    }

    // 미답변 문의 위젯 (네 번째 위젯)
    if (statItems[3]) {
        statItems[3].style.cursor = 'pointer';
        statItems[3].addEventListener('click', () => {
            window.location.href = 'admin_customer_support.html';
        });
    }
});

// 방문자 차트 초기화 함수
function initVisitorsChart() {
    const ctx = document.getElementById('visitorsChart').getContext('2d');
    window.visitorsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: '일일 방문자 수',
                data: [],
                borderColor: '#e50914',
                backgroundColor: 'rgba(229, 9, 20, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // 초기 데이터 로드
    updateVisitorsData();
}

// 최근 7일 날짜 배열 생성
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);  // 시간을 00:00:00으로 설정
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        }));
    }
    return dates;
}

// 방문자 데이터 업데이트
async function updateVisitorsData() {
    try {
        const response = await fetch('/api/admin/visitors/weekly');
        if (!response.ok) throw new Error('데이터를 불러올 수 없습니다.');
        
        const data = await response.json();
        window.visitorsChart.data.datasets[0].data = data.visitors;
        window.visitorsChart.update();
    } catch (error) {
        console.error('방문자 데이터 로드 실패:', error);
        // 에러 발생 시 사용자에게 알림
        alert('방문자 데이터를 불러오는데 실패했습니다.');
    }
}

// 대시보드 통계 초기화
async function updateDashboardStats() {
    try {
        // 오늘 방문자 수 조회
        const todayResponse = await fetch('/api/admin/visitors/today');
        if (!todayResponse.ok) throw new Error('방문자 데이터를 불러올 수 없습니다.');
        const todayData = await todayResponse.json();
        
        // 총 회원수 조회
        const usersResponse = await fetch('/api/admin/total-users');
        if (!usersResponse.ok) throw new Error('회원 데이터를 불러올 수 없습니다.');
        const usersData = await usersResponse.json();
        
        // 총 게시글 수 조회
        const postsResponse = await fetch('/api/admin/total-posts');
        if (!postsResponse.ok) throw new Error('게시글 데이터를 불러올 수 없습니다.');
        const postsData = await postsResponse.json();
        
        // 미답변 문의글 수 조회
        const inquiriesResponse = await fetch('/api/admin/pending-inquiries');
        if (!inquiriesResponse.ok) throw new Error('문의글 데이터를 불러올 수 없습니다.');
        const inquiriesData = await inquiriesResponse.json();
        
        // 각 통계 업데이트
        document.getElementById('today-visitors').textContent = todayData.count;
        document.getElementById('total-users').textContent = usersData.count;
        document.getElementById('total-posts').textContent = postsData.count;
        document.getElementById('pending-inquiries').textContent = inquiriesData.count;
    } catch (error) {
        console.error('통계 데이터 로드 실패:', error);
        alert('통계 데이터를 불러오는데 실패했습니다.');
    }
}
