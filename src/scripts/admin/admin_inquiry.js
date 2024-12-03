const formatStatus = (status) => {
    let statusText = '';
    let statusClass = '';

    switch (status) {
        case 'open':
            statusText = '처리 대기 중';
            statusClass = 'status-pending'; // 빨간색
            break;
        case 'pending':
            statusText = '처리 중';
            statusClass = 'status-pending'; // 빨간색
            break;
        case 'closed':
            statusText = '처리 완료';
            statusClass = 'status-completed'; // 초록색
            break;
        default:
            statusText = '알 수 없음';
            statusClass = ''; // 기본 상태
            break;
    }

    return { text: statusText, class: statusClass };
};

document.addEventListener('DOMContentLoaded', async () => {
    const inquiryList = document.querySelector('.inquiry-list');

    // 모든 문의 내역 가져오기
    try {
        const response = await fetch('/api/all-inquiries');
        const result = await response.json();

        // API 응답 확인
        console.log('API 응답:', result); // 응답 내용을 콘솔에 출력

        if (result.success) {
            if (result.inquiries && Array.isArray(result.inquiries) && result.inquiries.length > 0) {
                let totalInquiries = 0;
                let completedInquiries = 0;
                let pendingInquiries = 0;

                result.inquiries.forEach(inquiry => {
                    totalInquiries++;
                    const { text, class: statusClass } = formatStatus(inquiry.status); // 상태와 클래스 가져오기

                    // 상태에 따라 카운트 증가
                    if (inquiry.status === 'closed') {
                        completedInquiries++;
                    } else if (inquiry.status === 'open' || inquiry.status === 'pending') {
                        pendingInquiries++;
                    }

                    const inquiryDiv = document.createElement('div');
                    inquiryDiv.classList.add('inquiry-item');
                    inquiryDiv.innerHTML = `
                        <h4>${inquiry.title} (${inquiry.email})</h4>
                        <p><strong>유형:</strong> ${inquiry.inquiry_type}</p> <!-- 문의 유형 추가 -->
                        <p><strong>상태:</strong> <span class="${statusClass}">${text}</span></p> <!-- 상태 추가 -->
                        <p><strong>작성일:</strong> ${new Date(inquiry.created_at).toLocaleString()}</p>
                    `;
                    inquiryDiv.onclick = () => openInquiryDetailPopup(inquiry);
                    inquiryList.appendChild(inquiryDiv);
                });

                // 통계 데이터 업데이트
                document.getElementById('totalInquiries').textContent = totalInquiries;
                document.getElementById('completedInquiries').textContent = completedInquiries;
                document.getElementById('pendingInquiries').textContent = pendingInquiries;
            } else {
                inquiryList.innerHTML = '<p>문의 내역이 없습니다.</p>';
            }
        } else {
            inquiryList.innerHTML = '<p>문의 내역을 가져오는 데 실패했습니다.</p>';
        }
    } catch (error) {
        console.error('문의 내역을 가져오는 중 오류 발생:', error);
        inquiryList.innerHTML = '<p>문의 내역을 불러오는 중 오류가 발생했습니다.</p>';
    }
});

// 상태를 업데이트하는 함수
const updateInquiryStatus = async (inquiryId, status, inquiry) => { // inquiry 인자 추가
    try {
        const response = await fetch(`/api/update-inquiry-status/${inquiryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        // 응답이 JSON인지 확인
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            console.log('상태가 성공적으로 업데이트되었습니다.');
            loadReplies(inquiryId, inquiry); // 답글 목록 새로 고침
        } else {
            console.error('상태 업데이트에 실패했습니다: ' + result.message);
        }
    } catch (error) {
        console.error('상태 업데이트 중 오류 발생:', error);
    }
};

// 답글을 서버에 제출하는 함수
const submitReply = async (inquiryId, replyContent, inquiry) => {
    try {
        const response = await fetch('/api/reply-inquiry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inquiryId, replyContent }),
        });

        const result = await response.json();
        if (result.success) {
            alert('답글이 성공적으로 저장되었습니다.');
            // 상태를 "처리 완료"로 변경
            await updateInquiryStatus(inquiryId, 'closed', inquiry); // 상태 업데이트 함수 호출
            // 페이지 새로 고침
            location.reload(); // 페이지 새로 고침
        } else {
            alert('답글 저장에 실패했습니다: ' + result.message);
        }
    } catch (error) {
        console.error('답글 제출 중 오류 발생:', error);
        alert('답글 제출 중 오류가 발생했습니다.');
    }
};

const editReply = async (replyId, currentContent, inquiryId, inquiry) => { // inquiry 인자 추가
    const newContent = prompt('답글을 수정하세요:', currentContent);
    if (newContent !== null && newContent.trim() !== '') {
        try {
            const response = await fetch(`/api/reply-inquiry/${replyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent }),
            });
            const result = await response.json();
            if (result.success) {
                alert('답글이 수정되었습니다.');
                loadReplies(inquiryId); // 답글 목록 새로 고침
            } else {
                alert('답글 수정에 실패했습니다: ' + result.message);
            }
        } catch (error) {
            console.error('답글 수정 중 오류 발생:', error);
            alert('답글 수정 중 오류가 발생했습니다.');
        }
    }
};
// 답글 삭제 함수
const deleteReply = async (replyId, inquiryId, inquiry) => { // inquiry 인자 추가
    if (confirm('정말로 이 답글을 삭제하시겠습니까?')) {
        try {
            const response = await fetch(`/api/reply-inquiry/${replyId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                alert('답글이 삭제되었습니다.');
                // 상태를 "처리 대기 중"으로 변경
                await updateInquiryStatus(inquiryId, 'open', inquiry); // 상태 업데이트 함수 호출

                location.reload(); // 페이지 새로 고침
                // 답글 목록 새로 고침
                await loadReplies(inquiryId, inquiry); // 답글 목록 새로 고침
                // 답글 입력 공간과 제출 버튼 다시 보이기
                const replySection = document.getElementById('replySection');
                replySection.style.display = 'block'; // 답글 달기 섹션 보이기
            } else {
                alert('답글 삭제에 실패했습니다: ' + result.message);
            }
        } catch (error) {
            console.error('답글 삭제 중 오류 발생:', error);
            alert('답글 삭제 중 오류가 발생했습니다.');
        }
    }
};


const openInquiryDetailPopup = (inquiry) => {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    const attachmentName = inquiry.attachment_path ? inquiry.attachment_path.split('/').pop() : null; // 파일 이름 추출

    const { text: statusText, class: statusClass } = formatStatus(inquiry.status); // 상태와 클래스 가져오기

    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-button">&times;</span>
            <h4 class="popup-title">${inquiry.title}</h4>
            <h4 class="popup-email">${inquiry.email}</h4>
            <p><strong>유형:</strong> ${inquiry.inquiry_type}</p>
            <p><strong>작성일:</strong> ${new Date(inquiry.created_at).toLocaleString()}</p>
            <p><strong>상태:</strong> <span class="${statusClass}">${statusText}</span></p> <!-- 상태 추가 -->
            ${attachmentName ? `<p><strong>첨부파일:</strong> <a href="${inquiry.attachment_path}" target="_blank">${attachmentName}</a></p>` : '<p>첨부파일이 없습니다.</p>'}
            <p><strong>내용:</strong> ${inquiry.content}</p>
            
            <div id="replySection">
                <h5>답글 달기</h5>
                <textarea id="replyContent" rows="4" placeholder="답글을 입력하세요..."></textarea>
                <button id="submitReply">답글 제출</button>
            </div>
            <h5 id="replyListTitle" style="display: none;">답글 목록</h5> <!-- 제목 숨김 -->
            <div id="replyList"></div>
        </div>
    `;
    document.body.appendChild(popup);

    // 답글 제출 버튼 이벤트
    popup.querySelector('#submitReply').onclick = async () => {
        const replyContent = document.getElementById('replyContent').value;
        if (replyContent.trim() === '') {
            alert('답글을 입력하세요.');
            return;
        }
        await submitReply(inquiry.id, replyContent);
        loadReplies(inquiry.id); // 답글 목록 새로 고침
        document.getElementById('replyContent').value = ''; // 입력 필드 초기화

        const replyListTitle = document.getElementById('replyListTitle');
        const replyList = document.getElementById('replyList');
        replyListTitle.style.display = 'block'; // 제목 보이기
        replyList.style.display = 'block'; // 답글 목록 보이기
    };

    // 팝업 닫기 버튼 이벤트
    popup.querySelector('.close-button').onclick = () => {
        document.body.removeChild(popup);
    };

    // 기존 답글 로드
    loadReplies(inquiry.id);
};

// 답글 목록 로드 함수
const loadReplies = async (inquiryId, inquiry) => {
    const replyList = document.getElementById('replyList');
    const replySection = document.getElementById('replySection'); // 답글 달기 섹션 가져오기
    const replyListTitle = document.getElementById('replyListTitle'); // 답글 목록 제목 가져오기

    // 기존 목록 초기화
    replyList.innerHTML = ''; 

    // 기존 버튼 컨테이너가 있다면 삭제
    const existingButtonContainer = document.querySelector('.reply-buttons-container');
    if (existingButtonContainer) {
        existingButtonContainer.remove();
    }

    // 버튼을 추가할 새로운 컨테이너 생성
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('reply-buttons-container');

    try {
        const response = await fetch(`/api/replies/${inquiryId}`);
        const result = await response.json();

        if (result.success) {
            if (result.replies.length > 0) {
                // 답글이 있는 경우
                result.replies.forEach(reply => {
                    const replyDiv = document.createElement('div');
                    replyDiv.classList.add('reply-item'); // 클래스 추가 (스타일링을 위해)
                    replyDiv.innerHTML = `
                        <p>${reply.content}</p>
                    `;
                    replyList.appendChild(replyDiv);
                });

                // 수정 및 삭제 버튼을 새로운 컨테이너에 추가
                buttonContainer.innerHTML = `
                    <button class="edit-button" onclick="editReply(${result.replies[0].id}, '${result.replies[0].content}', ${inquiryId}, ${JSON.stringify(inquiry)})">수정</button>
                    <button class="delete-button" onclick="deleteReply(${result.replies[0].id}, ${inquiryId}, ${JSON.stringify(inquiry)})">삭제</button>
                `;
                replyList.parentNode.appendChild(buttonContainer); // 버튼 컨테이너를 답글 목록 아래에 추가

                // 답글 입력 공간과 제출 버튼 숨기기
                replySection.style.display = 'none'; // 답글 달기 섹션 숨김

                // 답글 목록 보이기
                replyList.style.display = 'block'; // 답글 목록 보이기
                replyListTitle.style.display = 'block'; // 제목 보이기
            } else {
                // 답글이 없는 경우
                replyList.innerHTML = '<p>답글이 없습니다.</p>';
                replyList.style.display = 'none'; // 답글 목록 숨기기
                replyListTitle.style.display = 'none'; // 제목 숨기기
            }
        } else {
            replyList.innerHTML = '<p>답글을 불러오는 중 오류가 발생했습니다.</p>';
            replyList.style.display = 'none'; // 답글 목록 숨기기
            replyListTitle.style.display = 'none'; // 제목 숨기기
        }
    } catch (error) {
        console.error('답글 로드 중 오류 발생:', error);
        replyList.innerHTML = '<p>답글을 불러오는 중 오류가 발생했습니다.</p>';
        replyList.style.display = 'none'; // 답글 목록 숨기기
        replyListTitle.style.display = 'none'; // 제목 숨기기
    }
};