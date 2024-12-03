document.addEventListener('DOMContentLoaded', () => {
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);

            try {
                const response = await fetch('/api/submit-inquiry', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    alert('문의가 성공적으로 제출되었습니다.');
                    window.location.href = '/src/pages/support/Inquiry%20details.html'; // 내 문의내역 페이지로 이동
                } else {
                    alert('문의 제출에 실패했습니다. 다시 시도해주세요.');
                }
            } catch (error) {
                console.error('문의 제출 중 오류:', error);
                alert('서버와 통신 중 문제가 발생했습니다.');
            }
        });
    } else {
        console.error('inquiry-form 요소를 찾을 수 없습니다.');
    }
});