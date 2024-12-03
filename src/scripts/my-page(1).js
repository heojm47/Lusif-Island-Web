document.addEventListener("DOMContentLoaded", () => {

    // 초기 화면 설정 (개인정보 변경 화면)
    displayPersonalInfoVerification();

    // 사이드바 메뉴 클릭 이벤트
    const changeInfoLink = document.getElementById("change-info-link");
    const changePasswordLink = document.getElementById("change-password-link");
    const deleteAccountLink = document.getElementById("delete-account-link"); // 회원탈퇴 링크 추가
    if (changeInfoLink) {
        changeInfoLink.addEventListener("click", displayPersonalInfoVerification);
    }
    if (changePasswordLink) {
        changePasswordLink.addEventListener("click", displayPasswordVerification);
    }
    if (deleteAccountLink) { // 회원탈퇴 클릭 이벤트 연결
        deleteAccountLink.addEventListener("click", displayDeleteAccountVerification);
    }

    // 로그인 상태 갱신
    updateLoginStatus();
});

/** 로그인 상태 갱신 함수 */
async function updateLoginStatus() {
    const username = localStorage.getItem('username'); // 로컬 스토리지에서 닉네임 가져오기
    if (username) {
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `${username}님 환영합니다!`;
        }
    }
}

/** 개인정보 확인 화면 표시 */
function displayPersonalInfoVerification() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>개인정보 변경</h2>
        <p>개인정보를 변경하기 위해 비밀번호를 확인해주세요.</p>
        <div class="form-container">
            <label for="password">현재 비밀번호</label>
            <input type="password" id="password" placeholder="비밀번호 입력">
            <button type="button" id="verify-info-button">확인</button>
        </div>
    `;

    // 비밀번호 확인 버튼 이벤트 추가
    document.getElementById("verify-info-button").addEventListener("click", verifyPersonalInfo);
}

/** 개인정보 확인 API 호출 */
async function verifyPersonalInfo() {
    const password = document.getElementById("password").value;

    if (!password.trim()) {
        alert("비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (result.success) {
            displayPersonalInfoChangeForm();
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}

/** 개인정보 변경 화면 표시 */
function displayPersonalInfoChangeForm() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>개인정보 변경</h2>
        <p>고객님의 개인정보를 수정할 수 있습니다.</p>
        <div class="form-container">
            <label for="username">닉네임</label>
            <input type="text" id="username" placeholder="닉네임 입력">
            
            <label for="email">이메일</label>
            <input type="email" id="email" readonly>
            
            <button type="button" id="update-info-button">저장</button>
        </div>
    `;

    // 서버에서 기존 개인정보 가져오기
    fetch("/get-profile-info")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                document.getElementById("username").value = data.data.name;
                document.getElementById("email").value = data.data.email;
            }
        })
        .catch((error) => console.error(error));

    // 저장 버튼 이벤트 추가
    document.getElementById("update-info-button").addEventListener("click", updatePersonalInfo);
}

/** 개인정보 업데이트 요청 */
async function updatePersonalInfo() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;

    if (!username.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email }),
        });

        const result = await response.json();
        if (result.success) {
            alert("개인정보가 성공적으로 업데이트되었습니다.");

            // 로컬 스토리지 업데이트
            localStorage.setItem('username', username);

            // 메인 페이지의 Welcome 메시지 업데이트
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `${username}님 환영합니다!`;
            }

            // 메인 페이지 닉네임을 변경한 후 즉시 UI 갱신
            updateLoginStatus(); // 로그인 상태를 갱신하고 UI에 반영
        } else {
            alert("개인정보 업데이트에 실패했습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}

/** 개인정보 변경 화면 표시 */
function displayPersonalInfoChangeForm() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>개인정보 변경</h2>
        <p>고객님의 개인정보를 수정할 수 있습니다.</p>
        <div class="form-container">
            <label for="username">닉네임</label>
            <input type="text" id="username" placeholder="닉네임 입력">
            
            <label for="email">이메일</label>
            <input type="email" id="email" readonly>
            
            <button type="button" id="update-info-button">저장</button>
        </div>
    `;

    // 서버에서 기존 개인정보 가져오기
    fetch("/get-profile-info")
        .then((response) => {
            if (response.ok) return response.json();
            throw new Error("프로필 정보를 가져올 수 없습니다.");
        })
        .then((data) => {
            if (data.success) {
                document.getElementById("username").value = data.data.name;
                document.getElementById("email").value = data.data.email;
            }
        })
        .catch((error) => console.error(error));

    // 저장 버튼 이벤트 추가
    document.getElementById("update-info-button").addEventListener("click", updatePersonalInfo);
}

/** 개인정보 업데이트 요청 */
async function updatePersonalInfo() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;

    if (!username.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email }),
        });

        const result = await response.json();
        if (result.success) {
            alert("개인정보가 성공적으로 업데이트되었습니다.");
        } else {
            alert("개인정보 업데이트에 실패했습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}

/** 비밀번호 확인 화면 표시 */
function displayPasswordVerification() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>비밀번호 변경</h2>
        <p>고객님의 비밀번호를 확인해주세요.</p>
        <div class="form-container">
            <label for="current-password">현재 비밀번호</label>
            <input type="password" id="current-password" placeholder="현재 비밀번호 입력">
            <button type="button" id="verify-password-button">확인</button>
        </div>
    `;

    // 비밀번호 확인 버튼 이벤트 추가
    document.getElementById("verify-password-button").addEventListener("click", verifyPassword);
}

/** 비밀번호 확인 API 호출 */
async function verifyPassword() {
    const password = document.getElementById("current-password").value;

    if (!password.trim()) {
        alert("비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (result.success) {
            
            displayPasswordChangeForm();
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}

/** 비밀번호 변경 화면 표시 */
function displayPasswordChangeForm() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>비밀번호 변경</h2>
        <p>새 비밀번호를 입력해주세요.</p>
        <div class="form-container">
            <label for="new-password">새 비밀번호</label>
            <input type="password" id="new-password" placeholder="새 비밀번호 입력">
            
            <label for="confirm-password">비밀번호 확인</label>
            <input type="password" id="confirm-password" placeholder="비밀번호 확인">
            
            <button type="button" id="change-password-button">저장</button>
        </div>
    `;

    // 비밀번호 변경 버튼 이벤트 추가
    document.getElementById("change-password-button").addEventListener("click", changePassword);
}

/** 비밀번호 변경 API 호출 */
async function changePassword() {
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!newPassword.trim() || !confirmPassword.trim()) {
        alert("모든 필드를 입력해주세요.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    try {
        const response = await fetch("/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword }),
        });

        const result = await response.json();

        if (result.success) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            location.reload(); // 성공 후 페이지 새로고침
        } else {
            alert("비밀번호 변경에 실패했습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}



/** 회원탈퇴 확인 화면 표시 */
function displayDeleteAccountVerification() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2>회원탈퇴</h2>
        <p>회원탈퇴를 진행하기 위해 비밀번호를 입력해주세요.</p>
        <div class="form-container">
            <label for="delete-password">현재 비밀번호</label>
            <input type="password" id="delete-password" placeholder="비밀번호 입력">
            <button type="button" id="verify-delete-button">확인</button>
        </div>
    `;

    // 비밀번호 확인 버튼 이벤트 추가
    document.getElementById("verify-delete-button").addEventListener("click", verifyDeleteAccount);
}

/** 회원탈퇴 비밀번호 확인 API 호출 */
async function verifyDeleteAccount() {
    const password = document.getElementById("delete-password").value;

    if (!password.trim()) {
        alert("비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (result.success) {
            
            displayDeleteAccountConfirmation();
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버와의 통신 중 오류가 발생했습니다.");
    }
}

/** 회원탈퇴 최종 확인 화면 표시 */
function displayDeleteAccountConfirmation() {
    const mainContent = document.querySelector(".main-content");
    mainContent.innerHTML = `
        <h2 style="color: red;">정말로 회원탈퇴 하시겠습니까?</h2>
        <p style="color: red;">회원탈퇴를 진행하면 모든 정보가 삭제됩니다. 신중히 결정해주세요.</p>
        <div class="confirmation-buttons">
            <button id="confirm-delete-button" style="color: white; background-color: red; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">✔ 확인</button>
            <button id="cancel-delete-button" style="color: white; background-color: gray; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">✖ 취소</button>
        </div>
    `;

    document.getElementById("confirm-delete-button").addEventListener("click", () => {
        deleteAccount();  // 회원탈퇴 요청
    });
    // 회원탈퇴 취소 버튼 이벤트 추가
    document.getElementById("cancel-delete-button").addEventListener("click", () => {
        alert("회원탈퇴가 취소되었습니다.");
        displayPersonalInfoVerification(); // 초기 화면으로 돌아가기
    });
}
// 회원탈퇴 최종 확인 버튼 클릭 후 실행되는 함수
async function deleteAccount() {
    try {
        const response = await fetch('/delete-account', {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);  // 탈퇴 성공 메시지

            // 로그아웃 처리
            localStorage.removeItem('username'); // 로컬 스토리지에서 사용자 정보 삭제

            // 메인 페이지로 리다이렉션
            window.location.href = '/';  // 메인 페이지로 이동하여 환영 메시지와 UI 초기화

        } else {
            alert(result.message);  // 실패 메시지
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버와의 통신 중 오류가 발생했습니다.');
    }
}



/** 개인정보 업데이트 요청 */
async function updatePersonalInfo() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;

    if (!username.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email }),
        });

        console.log("Response Status:", response.status); // 응답 상태 코드 출력
          if (!response.ok) {
          throw new Error("서버에서 문제 발생. 상태 코드: " + response.status);
                   }
        // 응답 상태 코드 확인
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                alert("개인정보가 성공적으로 업데이트되었습니다.");

                // localStorage 업데이트
                localStorage.setItem('username', username);

                // 메인 페이지의 Welcome 메시지 업데이트
                const welcomeMessage = document.getElementById('welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.textContent = `${username}님 환영합니다!`;
                }

                // 메인 페이지 닉네임을 변경한 후 즉시 UI 갱신
                updateLoginStatus(); // 로그인 상태를 갱신하고 UI에 반영
            } else {
                alert("개인정보 업데이트에 실패했습니다: " + result.message);
            }
        } else {
            alert("서버에서 문제가 발생했습니다. 상태 코드: " + response.status);
        }
    } catch (error) {
        
    }
}

/** 로그아웃 처리 및 UI 갱신 */
function handleLogout() {
    // localStorage 비우기
    localStorage.removeItem('username');

    // UI 초기화
    document.getElementById('welcome-message').style.display = 'none';
    document.getElementById('logout').style.display = 'none';
    document.getElementById('login-button').style.display = 'block';
    document.querySelector('.signup-button').style.display = 'block';
    document.getElementById('mypage-button').style.display = 'none';
    document.getElementById('admin-dashboard-button').style.display = 'none';
}
