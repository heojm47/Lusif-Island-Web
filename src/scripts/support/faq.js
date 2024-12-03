document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    const faqContent = document.querySelectorAll('.content-detail');
    const closeButton = document.getElementById('close-faq');

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            // 모든 FAQ 항목 비활성화
            faqItems.forEach(i => i.classList.remove('active'));

            // 클릭한 항목 활성화
            item.classList.add('active');

            // 모든 FAQ 내용 숨기기
            faqContent.forEach(content => content.style.display = 'none');

            // 클릭한 항목에 해당하는 내용만 보이도록
            const contentId = item.getAttribute('data-content');
            const selectedContent = document.getElementById(contentId);
            selectedContent.style.display = 'block';

            // FAQ 내용 보이기
            document.getElementById('faq-content').style.display = 'block';
        });
    });

    // 닫기 버튼 클릭 시 FAQ 내용 숨기기 및 모든 버튼 비활성화
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            // FAQ 내용을 숨기기
            document.getElementById('faq-content').style.display = 'none';

            // 모든 FAQ 항목 비활성화
            faqItems.forEach(i => i.classList.remove('active'));
        });
    } else {
        console.error('ID가 "close-faq"인 요소를 찾을 수 없습니다.');
    }
});
