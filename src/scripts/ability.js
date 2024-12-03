function openPopup(skill, element) {
    const popup = document.getElementById('skill-popup');
    const popupContent = popup.querySelector('.popup-content');
    const title = document.getElementById('skill-title');
    const videos = document.getElementById('skill-videos');
    
    
    
    // 팝업이 이미 열려있는 경우
    if (popup.classList.contains('show')) {
        // 클릭된 스킬 박스가 이미 active 상태라면 팝업을 닫음
        if (element.classList.contains('active')) {
            closePopup(); // 팝업 닫기
            element.classList.remove('active'); // 스킬 박스의 active 클래스 제거
            return; // 더 이상 진행하지 않음
        }
    }


     // 모든 스킬 박스에서 active 클래스 제거
     document.querySelectorAll('.skill-box').forEach(box => box.classList.remove('active'));

     // 클릭된 스킬 박스에 active 클래스 추가
     if (element) {
         element.classList.add('active');
     }

    // 팝업을 보이도록 설정
    popup.classList.add('show');
    popup.style.display = 'flex';

    // 강제 스크롤 초기화
    popupContent.style.overflow = 'hidden';
    setTimeout(() => {
        popupContent.scrollTop = 0;
        popupContent.style.overflow = 'auto';
    }, 10);

    // 강제로 블러 효과 재적용
    popupContent.style.backdropFilter = 'none';
    setTimeout(() => {
        popupContent.style.backdropFilter = 'blur(10px)';
    }, 10); // 약간의 딜레이를 준 후 블러 효과를 다시 적용

    // 기존 테마 클래스 제거
    popupContent.classList.remove('fire-theme', 'ice-theme', 'lightning-theme');

    // 스킬에 따라 테마 적용
    if (skill === 'fire') {
        title.textContent = '화염 스킬';
        popupContent.classList.add('fire-theme');
        videos.innerHTML = `
            <div class="skill-video">
                <video src="../../assets/video/fire1cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>인페르노 스트라이크</h3>
                    <p>적에게 화염의 일격을 가해 불타는 고통을 선사합니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/fire2cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>플레임 서지</h3>
                    <p>불꽃의 기운을 끌어올려 자신의 공격력을 증폭시키고,<br>적에게 강력한 화염을 발산합니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/fire3cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>이터널 블레이즈</h3>
                    <p>분노한 불꽃이 폭발하며 엄청난 피해를 입히고,<br>보스에게 지속적인 화상 효과를 부여합니다.</p>
                </div>
            </div>
        `;
    }
    else if (skill === 'ice') {
        title.textContent = '얼음 스킬';
        popupContent.classList.add('ice-theme');
        videos.innerHTML = `
            <div class="skill-video">
                <video src="../../assets/video/ice1cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>프로스트 블로우</h3>
                    <p>얼음의 차가운 힘으로 적을 강타해 서늘한 충격을 줍니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/ice2cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>글래시얼 버스트</h3>
                    <p>얼음 입자들이 적들을 향해 날아가며 피해를 입히고,<br>자신의 얼음 속성 공격력을 더욱 증폭시킵니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/ice3cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>아크틱 바운드</h3>
                    <p>적을 얼음으로 묶어 일시적으로 움직임을 멈추게 하고,<br>이후 강력한 추가 데미지를 입힙니다.</p>
                </div>
            </div>
        `;
    }
    else if (skill === 'lightning') {
        title.textContent = '번개 스킬';
        popupContent.classList.add('lightning-theme');
        videos.innerHTML = `
            <div class="skill-video">
                <video src="../../assets/video/lightning1cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>쇼크웨이브</h3>
                    <p>번개의 힘을 모아 적을 강타하여 강렬한 충격을 선사합니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/lightning2cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>볼티지 래쉬</h3>
                    <p>전기의 힘이 폭발하여 주변의 적들에게 전격을 날리며,<br>자신의 번개 데미지를 한층 더 강화시킵니다.</p>
                </div>
            </div>
            <hr class="skill-divider">
            <div class="skill-video">
                <video src="../../assets/video/lightning3cut.mp4" controls loop></video>
                <div class="skill-details">
                    <h3>라이트닝 블래스트</h3>
                    <p>천둥과 번개가 연쇄적으로 폭발하며 주변의 모든 적에게 파괴적인 데미지를 입힙니다.</p>
                </div>
            </div>
        `;
    }

    // 팝업을 열 때 show 클래스를 추가
    popup.classList.add('show'); // 나타남 클래스 추가
    popup.style.display = 'flex'; // display를 flex로 설정


    // 모든 비디오 자동 재생
    const videoElements = popupContent.querySelectorAll('video');
    videoElements.forEach(video => {
        video.play(); // 각 비디오 자동 재생
    });
}

function closePopup() {
    const popup = document.getElementById('skill-popup');
    const videoElements = popup.querySelectorAll('video');
    videoElements.forEach(video => {
        video.pause(); // 팝업 닫을 때 비디오 정지
    });

    popup.classList.remove('show'); // 나타남 클래스 제거
    popup.classList.add('hide'); // 사라짐 클래스 추가
    popup.addEventListener('animationend', () => {
        popup.style.display = 'none'; // display를 none으로 설정
        popup.classList.remove('hide'); // hide 클래스 제거
    }, { once: true }); // 한 번만 실행되도록 설정

    // 모든 스킬 박스에서 active 클래스 제거
    document.querySelectorAll('.skill-box').forEach(box => box.classList.remove('active'));
}