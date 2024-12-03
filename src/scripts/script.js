/* dropdown + main - menu ctrl */
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.main-menu > li');
    const dropdownContainer = document.querySelector('.dropdown-container');
    let timeoutId;

    // 메인 페이지 체크 로직 수정
    const isMainPage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/' ||
                      window.location.pathname.endsWith('/public/');
    
    console.log('현재 경로:', window.location.pathname);
    console.log('메인 페이지 여부:', isMainPage);

    if (isMainPage) {
        const modal = document.getElementById('trailer-modal');
        const btn = document.querySelector('.cta-button.secondary');
        const closeBtn = document.querySelector('.close-modal');
        const youtubeFrame = document.getElementById('youtube-frame');

        console.log('모달 요소 확인:', {
            modal: !!modal,
            btn: !!btn,
            closeBtn: !!closeBtn,
            youtubeFrame: !!youtubeFrame
        });

        if (btn && modal && closeBtn && youtubeFrame) {
            // YouTube URL에 추가 매개변수 포함
            const videoUrl = "https://www.youtube.com/embed/26frKaUEiQ0?enablejsapi=1&origin=" + 
                            window.location.origin + 
                            "&modestbranding=1&rel=0&showinfo=0";
            
            // 이벤트 리스너를 함수로 분리
            const openModal = function(e) {
                e.preventDefault();
                modal.style.display = "block";
                youtubeFrame.src = videoUrl;
            };

            const closeModal = function() {
                modal.style.display = "none";
                youtubeFrame.src = "";
            };

            // 이벤트 리스너 등록
            btn.addEventListener('click', openModal);
            closeBtn.addEventListener('click', closeModal);
            
            window.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });

            console.log('트레일러 모달 초기화 완료');
        } else {
            console.log('트레일러 모달 요소를 찾을 수 없습니다');
        }
    }

    //방문자 수 기록 코드//
    fetch('/api/visitors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(error => console.error('방문자 수 기록 실패:', error));
    //방문자 수 기록 코드//

    function showDropdown() {
        clearTimeout(timeoutId);
        dropdownContainer.classList.add('show');
    }

    function hideDropdown() {
        timeoutId = setTimeout(() => {
            dropdownContainer.classList.remove('show');
        }, 300);
    }

    menuItems.forEach(item => {
        item.addEventListener('mouseenter', showDropdown);
        item.addEventListener('mouseleave', hideDropdown);
    });

    dropdownContainer.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });

    dropdownContainer.addEventListener('mouseleave', hideDropdown);
});