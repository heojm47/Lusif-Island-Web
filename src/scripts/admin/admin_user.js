document.addEventListener('DOMContentLoaded', async () => {
    // 사용자 목록을 가져오는 함수
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users'); // 사용자 목록을 가져오는 API 호출
            const result = await response.json();
            if (result.success) {
                updateUserList(result.users); // 사용자 목록 업데이트
            } else {
                console.error('사용자 목록을 가져오는 데 실패했습니다.');
            }
        } catch (error) {
            console.error('오류 발생:', error);
        }
    };

    const updateUserList = (users) => {
        const userList = document.getElementById('userList');
        const userInfo = document.getElementById('userInfo');
        const totalUsers = document.getElementById('totalUsers');
        userList.innerHTML = ''; // 기존 목록 초기화
        users.forEach(user => {
            const li = document.createElement('li');
            
            // 사용자 이름과 이메일 표시
            const userInfoText = document.createElement('span');
            userInfoText.textContent = `${user.name} (${user.email})`; // 사용자 이름과 이메일 표시
            li.appendChild(userInfoText); // 사용자 정보 추가
    
            // 클릭 이벤트 추가
            li.onclick = (event) => {
                event.stopPropagation(); // 클릭 이벤트 전파 방지
                userInfo.innerHTML = ''; // 이전 내용 초기화
    
                // 닫기 버튼 추가
                const closeButton = document.createElement('button');
                closeButton.textContent = 'X'; // 닫기 버튼 텍스트
                closeButton.style.float = 'right'; // 오른쪽 정렬
                closeButton.style.border = 'none';
                closeButton.style.backgroundColor = 'transparent';
                closeButton.style.cursor = 'pointer';
                closeButton.onclick = (e) => {
                    e.stopPropagation(); // 클릭 이벤트 전파 방지
                    userInfo.style.display = 'none'; // 사용자 정보 숨기기
                };
                userInfo.appendChild(closeButton); // 닫기 버튼 추가
    
                // 생성일 처리
                const createdAt = new Date(user.created_at); // created_at을 Date 객체로 변환
                const formattedDate = createdAt.toLocaleDateString(); // 원하는 형식으로 변환
    
                userInfo.appendChild(document.createTextNode(`ID: ${user.id} | 생성일: ${formattedDate}`));
                userInfo.style.display = 'block'; // 클릭 시 표시
                userInfo.style.top = `${li.getBoundingClientRect().bottom + window.scrollY}px`; // 리스트 항목 아래에 위치
                userInfo.style.left = `${li.getBoundingClientRect().left}px`; // 리스트 항목 왼쪽에 위치
            };
    
            // 버튼을 감싸는 div 추가
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex'; // Flexbox 사용
            buttonContainer.style.justifyContent = 'flex-end'; // 버튼을 오른쪽으로 정렬
    
            // 삭제 버튼 추가
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '정지';
            deleteButton.onclick = async (event) => {
                event.stopPropagation(); // 클릭 이벤트 전파 방지
                if (confirm('정말로 이 사용자를 이용 정지 하시겠습니까?')) {
                    await deleteUser(user.id);
                    await fetchUsers(); // 사용자 목록 새로 고침
                }
            };
    
            // 비밀번호 변경 버튼 추가
            const changePasswordButton = document.createElement('button');
            changePasswordButton.textContent = '비밀번호 변경';
            changePasswordButton.onclick = (event) => {
                event.stopPropagation(); // 클릭 이벤트 전파 방지
                const newPassword = prompt('새 비밀번호를 입력하세요:');
                if (newPassword) {
                    changeUserPassword(user.id, newPassword);
                }
            };
    
            // 버튼을 버튼 컨테이너에 추가
            buttonContainer.appendChild(deleteButton);
            buttonContainer.appendChild(changePasswordButton);
            li.appendChild(buttonContainer); // 버튼 컨테이너를 리스트 항목에 추가
            userList.appendChild(li);
        });

        // 총 사용자 수 업데이트
        totalUsers.textContent = `총 유저 수: ${users.length}`;
    };

// 클릭 외부 시 사용자 정보 숨기기
document.addEventListener('click', (event) => {
    const userInfo = document.getElementById('userInfo');
    if (!userInfo.contains(event.target) && !document.getElementById('userList').contains(event.target)) {
        userInfo.style.display = 'none'; // 클릭 시 사용자 정보 숨기기
    }
});
// 사용자 삭제 함수
const deleteUser = async (userId) => {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
        } else {
            console.error('사용자 삭제 실패:', result.message);
        }
    } catch (error) {
        console.error('오류 발생:', error);
    }
};

// 비밀번호 변경 함수
const changeUserPassword = async (userId, newPassword) => {
    try {
        const response = await fetch(`/api/users/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword }),
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
        } else {
            console.error('비밀번호 변경 실패:', result.message);
        }
    } catch (error) {
        console.error('오류 발생:', error);
        }
    };

    // 초기 데이터 로드
    await fetchUsers();
});