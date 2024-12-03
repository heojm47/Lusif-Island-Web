document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sort-options input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', function() {
            // 모든 아이콘을 기본 상태로 초기화
            document.querySelectorAll('.sort-options .icon i').forEach((icon) => {
                icon.classList.remove('fa-check'); // 체크 아이콘 제거
                icon.classList.add('fa-circle'); // 기본 아이콘으로 변경
            });

            // 선택된 라디오 버튼의 아이콘을 체크 아이콘으로 변경
            const selectedIcon = this.nextElementSibling.querySelector('i');
            selectedIcon.classList.remove('fa-circle');
            selectedIcon.classList.add('fa-check');

            // 정렬 변경 이벤트 발생
            const sortChangeEvent = new CustomEvent('sortChange', {
                detail: { sortBy: this.value }
            });
            document.dispatchEvent(sortChangeEvent);
        });
    });

    // 초기 상태 설정
    const checkedRadio = document.querySelector('.sort-options input[type="radio"]:checked');
    if (checkedRadio) {
        const selectedIcon = checkedRadio.nextElementSibling.querySelector('i');
        selectedIcon.classList.remove('fa-circle');
        selectedIcon.classList.add('fa-check');
    }
});