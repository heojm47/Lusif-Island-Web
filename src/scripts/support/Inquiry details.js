// 상태 변환 함수
const formatStatus = (status) => {
    switch (status) {
        case "open":
            return "처리 대기 중";
        case "pending":
            return "처리 중";
        case "closed":
            return "처리 완료";
        default:
            return "알 수 없음";
    }
};

// 문의 유형 변환 함수
const formatInquiryType = (type) => {
    switch (type) {
        case "account_issue":
            return "계정 관련 문제";
        case "login_issue":
            return "로그인 문제";
        case "account_update":
            return "계정 정보 변경 요청";
        case "password_reset":
            return "비밀번호 재설정/분실";
        case "security_issue":
            return "계정 보안 관련 문의";
        case "general_inquiry":
            return "일반 문의";
        case "other":
            return "기타";
        default:
            return type || "N/A";
    }
};

// 팝업 열기 함수
const openInquiryDetailPopup = async (inquiryId) => {
    try {
        const response = await fetch(`/api/inquiries/${inquiryId}`);
        const result = await response.json();

        if (result.success) {
            const inquiry = result.inquiry;
            const popup = document.getElementById("inquiry-detail-popup");
            
            // 팝업 내용 설정
            document.getElementById("popup-title").textContent = inquiry.title || "N/A";
            document.getElementById("popup-inquiry-type").textContent = formatInquiryType(inquiry.inquiry_type);
            document.getElementById("popup-created-at").textContent = new Date(inquiry.created_at).toLocaleString() || "N/A";
            document.getElementById("popup-status").textContent = formatStatus(inquiry.status);
            document.getElementById("popup-content").textContent = inquiry.content || "N/A";
            document.getElementById("popup-reply-content").textContent = inquiry.reply_content || "답변이 아직 작성되지 않았습니다.";
            document.getElementById("popup-reply-created-at").textContent = inquiry.reply_created_at
                ? new Date(inquiry.reply_created_at).toLocaleString()
                : "N/A";

            // 팝업 표시
            popup.classList.remove("hidden");
            popup.style.display = "block";
        } else {
            alert("문의 내역을 가져오는 데 실패했습니다.");
        }
    } catch (error) {
        console.error("문의 상세 조회 중 오류 발생:", error);
    }
};

// 팝업 닫기 함수
const closePopup = () => {
    const popup = document.getElementById("inquiry-detail-popup");
    popup.classList.add("hidden");
    popup.style.display = "none";
};

// DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", async () => {
    const popup = document.getElementById("inquiry-detail-popup");
    const closeButton = popup.querySelector(".close-button");

    // 닫기 버튼 클릭 이벤트
    closeButton.addEventListener("click", closePopup);

    // 팝업 외부 클릭 시 닫기
    window.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    try {
        const response = await fetch("/api/inquiries");
        if (response.status === 401) {
            window.location.href = "../log-in/log-in.html";
            return;
        }

        const result = await response.json();

        if (result.success && result.inquiries.length > 0) {
            const inquiryList = document.querySelector(".inquiry-list");
            const inquiryEmpty = document.querySelector(".inquiry-empty");

            // 기존 데이터 초기화
            inquiryList.innerHTML = "";
            inquiryEmpty.style.display = "none";

            const formatDate = (date) => {
                const options = {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                };
                return new Intl.DateTimeFormat("ko-KR", options).format(new Date(date));
            };

            result.inquiries.forEach((inquiry) => {
                const inquiryDiv = document.createElement("div");
                inquiryDiv.classList.add("inquiry-item");

                inquiryDiv.innerHTML = `
                    <div class="inquiry-header">
                        <h3>${inquiry.title}</h3>
                        <p>유형: ${formatInquiryType(inquiry.inquiry_type)}</p>
                    </div>
                    <div class="inquiry-body">
                        <p><strong>작성일:</strong> ${formatDate(inquiry.created_at)}</p>
                        <p><strong>상태:</strong> ${formatStatus(inquiry.status)}</p>
                    </div>
                `;

                // 모든 문의 항목에 클릭 이벤트 추가
                inquiryDiv.style.cursor = "pointer";
                inquiryDiv.addEventListener("click", () => openInquiryDetailPopup(inquiry.id));

                inquiryList.appendChild(inquiryDiv);
            });
        } else {
            document.querySelector(".inquiry-empty").style.display = "block";
        }
    } catch (error) {
        console.error("문의 내역을 가져오는 중 오류 발생:", error);
        document.querySelector(".inquiry-empty").style.display = "block";
    }
});
