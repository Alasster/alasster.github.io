/* ==========================================================================
   ALASSTER.SITE — UNIFIED LESSON CONTROLLER (ALL LESSONS 9-11)
   Manages Top Navbar, Classes Modal Drawer, Mobile Nav Controls & Lesson Logic
   ========================================================================== */

(function () {
  'use strict';

  /* 1. CURRICULUM DATABASE */
  const LESSONS_DATABASE = {
    c9: {
      name: "9 класс",
      title: "9 класс • Компьютерные сети",
      lessons: [
        { num: 1, title: "Социальные и этические аспекты ИИ", file: "9 класс/1 четверть/1 урок.html" },
        { num: 2, title: "IP-адрес компьютера", file: "9 класс/1 четверть/2 урок.html" },
        { num: 3, title: "IP-адрес и сетевые протоколы", file: "9 класс/1 четверть/3 урок.html" },
        { num: 4, title: "IP-адрес. Маска подсети", file: "9 класс/1 четверть/4 урок.html" },
        { num: 5, title: "Доменная система имён (DNS)", file: "9 класс/1 четверть/5 урок.html" },
        { num: 6, title: "Определение пропускной способности сети", file: "9 класс/1 четверть/6 урок.html" }
      ]
    },
    c10emn: {
      name: "10 ЕМН",
      title: "10 класс ЕМН • Машинное обучение",
      lessons: [
        { num: "1-2", title: "История развития искусственного интеллекта", file: "10 ЕМН/1 четверть/1 -2 урок.html" },
        { num: 3, title: "Основные понятия машинного обучения", file: "10 ЕМН/1 четверть/3 урок.html" },
        { num: 4, title: "Практика: понятия машинного обучения", file: "10 ЕМН/1 четверть/4 урок.html" },
        { num: 5, title: "Перцептрон и его назначение", file: "10 ЕМН/1 четверть/5 урок.html" },
        { num: 6, title: "Практика: перцептрон в Excel", file: "10 ЕМН/1 четверть/6 урок.html" },
        { num: 7, title: "Практика: однослойный перцептрон в Excel", file: "10 ЕМН/1 четверть/7 урок.html" },
        { num: 8, title: "Модели машинного обучения", file: "10 ЕМН/1 четверть/8 урок.html" },
        { num: 9, title: "Управление приложением жестами", file: "10 ЕМН/1 четверть/9 урок.html" },
        { num: 10, title: "Алгоритмы МО: k-NN (Ближайшие соседи)", file: "10 ЕМН/1 четверть/10 урок.html" }
      ]
    },
    c10ogn: {
      name: "10 ОГН",
      title: "10 класс ОГН • Информационные технологии",
      lessons: [
        { num: 1, title: "История развития искусственного интеллекта", file: "10 ОГН/1 четверть/1 урок.html" },
        { num: 2, title: "Основные понятия машинного обучения", file: "10 ОГН/1 четверть/2 урок.html" },
        { num: 3, title: "Модели машинного обучения", file: "10 ОГН/1 четверть/3 урок.html" },
        { num: 4, title: "Проектная мастерская: презентация о МО", file: "10 ОГН/1 четверть/4 урок.html" },
        { num: 5, title: "Перцептрон и его назначение", file: "10 ОГН/1 четверть/5 урок.html" },
        { num: 6, title: "Практика: перцептрон в Excel", file: "10 ОГН/1 четверть/6 урок.html" }
      ]
    },
    c11: {
      name: "11 класс",
      title: "11 класс • Нейронные сети и ИИ",
      lessons: [
        { num: 1, title: "Искусственные нейронные сети", file: "11 класс/1 четверть/1 урок.html" },
        { num: 2, title: "Задачи нейронных сетей", file: "11 класс/1 четверть/2 урок.html" },
        { num: 3, title: "Классификация задач ИИ", file: "11 класс/1 четверть/3 урок.html" },
        { num: 4, title: "Классификация задач ИИ — практика", file: "11 класс/1 четверть/4 урок.html" },
        { num: 5, title: "Управление приложением жестами", file: "11 класс/1 четверть/5 урок.html" },
        { num: 6, title: "Основы моделирования нейронных сетей", file: "11 класс/1 четверть/6 урок.html" }
      ]
    }
  };

  /* 2. DETECT CURRENT CLASS */
  function detectCurrentClass() {
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    if (path.includes('10 ЕМН')) return 'c10emn';
    if (path.includes('10 ОГН')) return 'c10ogn';
    if (path.includes('11 класс')) return 'c11';
    if (path.includes('9 класс')) return 'c9';
    return 'c9';
  }

  /* 3. CLASSES MODAL CONTROLLER */
  let activeTabId = detectCurrentClass();

  function renderModalLessons(classId) {
    const listEl = document.getElementById('modal-lessons-list');
    if (!listEl) return;
    const data = LESSONS_DATABASE[classId];
    if (!data) return;

    const currentPath = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');

    listEl.innerHTML = data.lessons.map(lesson => {
      const isCurrent = currentPath.endsWith(lesson.file);
      return `
        <a href="../../${lesson.file}" class="lesson-row-card ${isCurrent ? 'current-lesson' : ''}">
          <div class="lesson-badge-id">№${lesson.num}</div>
          <span class="lesson-title-label">${lesson.title}</span>
          ${isCurrent ? '<span class="lesson-current-tag">Текущий</span>' : '<i class="fa-solid fa-arrow-right lesson-arrow-icon"></i>'}
        </a>
      `;
    }).join('');
  }

  function openClassesModal() {
    const backdrop = document.getElementById('modal-backdrop-el');
    if (!backdrop) return;
    backdrop.classList.add('active');
    document.body.classList.add('modal-open');
    renderModalLessons(activeTabId);
  }

  function closeClassesModal() {
    const backdrop = document.getElementById('modal-backdrop-el');
    if (!backdrop) return;
    backdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function initClassesModal() {
    const openBtn = document.getElementById('open-classes-menu-btn');
    const closeBtn = document.getElementById('btn-close-modal-el');
    const backdrop = document.getElementById('modal-backdrop-el');
    const tabs = document.querySelectorAll('.class-tab-pill[data-class-id]');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openClassesModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeClassesModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeClassesModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop && backdrop.classList.contains('active')) {
        closeClassesModal();
      }
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTabId = tab.dataset.classId;
        renderModalLessons(activeTabId);
      });
    });

    // Initial active tab sync
    tabs.forEach(t => {
      if (t.dataset.classId === activeTabId) t.classList.add('active');
      else t.classList.remove('active');
    });
  }

  /* 4. MOBILE CONTROLS DELEGATOR & STATE SYNC */
  function updateMobileButtonsState() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    const activeIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn && activeIndex !== -1) {
      prevBtn.disabled = activeIndex === 0;
    }
    if (nextBtn && activeIndex !== -1) {
      nextBtn.disabled = activeIndex === slides.length - 1;
    }
  }

  function initMobileControls() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn && !prevBtn.dataset.navBound) {
      prevBtn.dataset.navBound = 'true';
      prevBtn.addEventListener('click', () => {
        const legacyPrev = document.getElementById('mobilePrev');
        if (legacyPrev && legacyPrev !== prevBtn && typeof legacyPrev.click === 'function') {
          legacyPrev.click();
        } else if (typeof window.changeSlide === 'function') {
          try { window.changeSlide(-1); } catch (e) {}
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true }));
        }
        setTimeout(updateMobileButtonsState, 50);
      });
    }

    if (nextBtn && !nextBtn.dataset.navBound) {
      nextBtn.dataset.navBound = 'true';
      nextBtn.addEventListener('click', () => {
        const legacyNext = document.getElementById('mobileNext');
        if (legacyNext && legacyNext !== nextBtn && typeof legacyNext.click === 'function') {
          legacyNext.click();
        } else if (typeof window.changeSlide === 'function') {
          try { window.changeSlide(1); } catch (e) {}
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }));
        }
        setTimeout(updateMobileButtonsState, 50);
      });
    }

    document.addEventListener('keydown', () => setTimeout(updateMobileButtonsState, 60));
    document.addEventListener('click', () => setTimeout(updateMobileButtonsState, 60));

    const slides = document.querySelectorAll('.slide');
    if (slides.length && window.MutationObserver) {
      const observer = new MutationObserver(() => updateMobileButtonsState());
      slides.forEach(slide => observer.observe(slide, { attributes: true, attributeFilter: ['class'] }));
    }

    updateMobileButtonsState();
  }

  /* 5. LESSON SPECIFIC LOGIC REGISTRY */
  const LESSON_SCRIPTS = {};

  /* Lesson 9-1 (9 класс - 1 урок) */
  LESSON_SCRIPTS['9-1'] = function() {
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.getElementById('dots');
        const totalSlides = slides.length;

        const nextButtonLabels = [
            '',
            'К трем вопросам',
            'К сферам',
            'К кейсам',
            'К формуле',
            'К проверке',
            'К практике',
            'К итогу'
        ];

        const dotTitles = [
            'Введение',
            'Как работает ИИ',
            'Этика ИИ',
            'Сферы применения',
            'Разбор кейса',
            'Аргументы об ИИ',
            'Мини-проверка',
            'Практическая работа',
            'Итог урока'
        ];

        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            const heading = slides[index].querySelector('h1, h2');
            const title = dotTitles[index] || (heading ? heading.innerText.trim().replace(/\s+/g, ' ') : `Слайд ${index + 1}`);
            dot.setAttribute('aria-label', `Слайд ${index + 1}: ${title}`);
            dot.setAttribute('title', `Слайд ${index + 1}: ${title}`);
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        slides.forEach((slide, index) => {
            if (index === 0 || index === totalSlides - 1) return;
            const container = slide.querySelector('.container');
            const actionRow = document.createElement('div');
            const button = document.createElement('button');
            actionRow.className = 'slide-action-row';
            button.className = 'start-btn';
            button.type = 'button';
            button.innerHTML = `${nextButtonLabels[index] || 'Дальше'} <i class="fas fa-arrow-right"></i>`;
            button.onclick = () => changeSlide(1);
            actionRow.appendChild(button);
            container.appendChild(actionRow);
        });

        function updateUI() {
            slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
            document.querySelectorAll('.dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
                if (index === currentSlide) dot.setAttribute('aria-current', 'step');
                else dot.removeAttribute('aria-current');
            });
            document.getElementById('progress').style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }

        function changeSlide(direction) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + direction));
            updateUI();
        }

        function goToSlide(index) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, index));
            updateUI();
        }

        const cases = {
            medicine: {
                icon: 'fa-heart-pulse',
                color: '#e11d48',
                title: 'ИИ находит признаки болезни на снимке',
                story: 'Система заметила подозрительный участок на рентгене. Врач получил предупреждение и назначил дополнительную проверку.',
                responsibility: 'Итоговый диагноз ставит врач. Разработчики отвечают за качество модели, больница - за правила использования.',
                fairness: 'Нужно проверить, одинаково ли хорошо модель работает для разных групп пациентов и разных аппаратов.',
                transparency: 'Пациенту объясняют, что ИИ показал вероятность, а не окончательный диагноз.',
                question: 'Можно ли разрешить ИИ самостоятельно сообщать пациенту диагноз? Почему?'
            },
            education: {
                icon: 'fa-school',
                color: '#4f46e5',
                title: 'ИИ советует ученику индивидуальный маршрут',
                story: 'Платформа решила, что ученику нужно больше простых заданий, потому что он ошибся в тесте после пропуска урока.',
                responsibility: 'Учитель проверяет рекомендацию и учитывает контекст: болезнь, стресс, отсутствие интернета.',
                fairness: 'Система не должна превращать временную ошибку в постоянный ярлык.',
                transparency: 'Ученик видит, какие темы вызвали трудности и как перейти на следующий уровень.',
                question: 'Что опаснее: строгая автоматическая оценка или мягкая рекомендация учителю?'
            },
            finance: {
                icon: 'fa-credit-card',
                color: '#16a34a',
                title: 'ИИ решает, дать ли кредит',
                story: 'Банк использует модель риска. Клиенту отказали, но в письме написано только: "решение принято автоматически".',
                responsibility: 'Банк отвечает за отказ и обязан дать канал для пересмотра решения человеком.',
                fairness: 'Нужно исключить скрытые признаки, которые заменяют дискриминацию: район проживания, происхождение, семейный статус.',
                transparency: 'Клиенту нужны понятные причины: доход, просрочки, долговая нагрузка, недостающие документы.',
                question: 'Какие данные о человеке банк не должен использовать даже ради точности?'
            },
            social: {
                icon: 'fa-comments',
                color: '#d97706',
                title: 'ИИ подбирает ленту в социальной сети',
                story: 'Алгоритм заметил, что подросток часто задерживается на тревожных видео, и начал показывать их еще больше.',
                responsibility: 'Платформа отвечает за дизайн рекомендаций, особенно когда речь идет о подростках.',
                fairness: 'Алгоритм не должен усиливать травлю, стереотипы и информационные пузыри.',
                transparency: 'Пользователь должен понимать, почему ему показывают контент, и иметь настройки влияния на ленту.',
                question: 'Что важнее для платформы: удержание внимания или благополучие пользователя?'
            }
        };

        const caseContent = document.getElementById('caseContent');
        const caseButtons = document.querySelectorAll('.case-btn');

        function renderCase(key) {
            const item = cases[key];
            caseContent.innerHTML = `
                <div class="case-title">
                    <i class="fas ${item.icon}" style="background:${item.color}"></i>
                    <div>
                        <h3>${item.title}</h3>
                        <p>${item.story}</p>
                    </div>
                </div>
                <div class="impact-grid">
                    <div class="impact"><strong>Ответственность</strong><p>${item.responsibility}</p></div>
                    <div class="impact"><strong>Справедливость</strong><p>${item.fairness}</p></div>
                    <div class="impact"><strong>Прозрачность</strong><p>${item.transparency}</p></div>
                </div>
                <div class="scenario">
                    <h3><i class="fas fa-comments"></i> Вопрос для обсуждения</h3>
                    <p>${item.question}</p>
                </div>
            `;
        }

        caseButtons.forEach((button) => {
            button.addEventListener('click', () => {
                caseButtons.forEach((btn) => btn.classList.remove('active'));
                button.classList.add('active');
                renderCase(button.dataset.case);
            });
        });

        const quizQuestions = [
            {
                question: 'ИИ банка отказал человеку в кредите. В письме указано: «автоматическое решение», но нет причин отказа и возможности пересмотра. Какая проблема здесь главная?',
                answer: 'Недостаток прозрачности и права на объяснение',
                options: ['Недостаток справедливости, потому что банк вообще не должен оценивать риски', 'Недостаток ответственности только у клиента, потому что он сам подал заявку', 'Недостаток пользы, потому что автоматизация всегда хуже ручной проверки'],
                feedback: 'Верно: проблема не в самом скоринге, а в том, что человек не понимает основание решения и не может его оспорить.'
            },
            {
                question: 'Система проверки сочинений чаще снижает баллы ученикам, которые используют диалектные выражения или пишут на русском как на втором языке. Что нужно проверить в первую очередь?',
                answer: 'Не дискриминирует ли модель отдельные группы учеников',
                options: ['Достаточно ли быстро модель выставляет оценку', 'Можно ли заменить письменные работы устными ответами', 'Нужно ли скрыть критерии, чтобы ученики не подстраивались'],
                feedback: 'Верно: здесь ключевой вопрос справедливости - одинаково ли корректно система оценивает разных учеников.'
            },
            {
                question: 'ИИ в больнице отметил снимок как «без опасных признаков», врач не стал перепроверять, а позже выяснилось, что болезнь была. Какой вывод самый точный?',
                answer: 'Нужно заранее распределить ответственность между врачом, больницей и разработчиками',
                options: ['Виноват только ИИ, потому что врач получил готовый ответ', 'ИИ в медицине нужно запретить, потому что любая ошибка недопустима', 'Пациент должен сам проверять медицинские алгоритмы перед приемом'],
                feedback: 'Верно: в медицине ИИ может помогать, но ответственность и контроль должны быть заранее прописаны.'
            },
            {
                question: 'Социальная сеть заметила, что подросток долго смотрит тревожные видео, и стала показывать их чаще. Формально алгоритм «учел интерес». В чем этический риск?',
                answer: 'Система может усиливать вредное состояние ради удержания внимания',
                options: ['Система нарушает прозрачность только потому, что видео короткие', 'Система несправедлива к авторам веселых видео', 'Система ответственна только за рекламу, но не за рекомендации'],
                feedback: 'Верно: интерес пользователя не всегда равен его благополучию, особенно когда речь идет о подростках.'
            },
            {
                question: 'Платформа после одной неудачной контрольной автоматически перевела ученика на упрощенные задания. До этого он учился хорошо, но пропустил неделю по болезни. Какое решение лучше?',
                answer: 'Оставить рекомендацию ИИ, но дать учителю проверить контекст и изменить маршрут',
                options: ['Полностью довериться ИИ, потому что он одинаково применяет правило ко всем', 'Скрыть результат от ученика, чтобы не снижать мотивацию', 'Отменить все адаптивные задания, потому что они могут ошибаться'],
                feedback: 'Верно: разумный контроль человеком снижает риск неверного ярлыка и сохраняет пользу персонализации.'
            },
            {
                question: 'ИИ для найма обучали на старых резюме компании. В прошлом на технические должности чаще брали кандидатов из одной группы. Какой риск наиболее вероятен?',
                answer: 'Модель может принять старую практику за правильный образец',
                options: ['Модель будет точнее, потому что использует реальные решения компании', 'Модель станет объективной, потому что не видит кандидата лично', 'Модель можно использовать без проверки, если она ускоряет отбор'],
                feedback: 'Верно: алгоритм может выглядеть нейтральным, но повторять перекосы, которые уже были в данных.'
            },
            {
                question: 'Медицинская система показывает: «риск высокий - 82%», но врач не видит, какие признаки повлияли на оценку. Что будет самым полезным улучшением?',
                answer: 'Показать факторы, которые сильнее всего повлияли на прогноз',
                options: ['Показывать только итоговый процент, чтобы не перегружать врача', 'Разрешить системе сразу назначать лечение при высоком риске', 'Скрывать результат от пациента, чтобы избежать тревоги'],
                feedback: 'Верно: прозрачность помогает врачу проверить вывод ИИ и объяснить пациенту дальнейшие действия.'
            },
            {
                question: 'Антифрод-система банка заблокировала карту туриста за границей. Это могло защитить от кражи, но человек остался без денег. Что лучше всего балансирует безопасность и права клиента?',
                answer: 'Быстрая проверка человеком и понятная процедура разблокировки',
                options: ['Никогда не блокировать операции, чтобы не мешать клиентам', 'Блокировать все необычные покупки без объяснений', 'Публиковать все правила антифрода, включая способы обхода защиты'],
                feedback: 'Верно: важен баланс - защита от мошенничества плюс возможность быстро исправить ошибку.'
            },
            {
                question: 'Новостная лента показывает человеку в основном материалы, с которыми он уже согласен, потому что такие посты он чаще дочитывает. Чем это опасно для общества?',
                answer: 'Может возникнуть информационный пузырь и усиление поляризации',
                options: ['Пользователь будет быстрее находить знакомые темы, и других последствий нет', 'Алгоритм станет прозрачным, потому что человек видит только приятные новости', 'Проблема только в авторах новостей, а не в системе рекомендаций'],
                feedback: 'Верно: персонализация может сузить картину мира и усилить конфликт между группами.'
            },
            {
                question: 'Школа хочет внедрить ИИ-наблюдение за поведением учеников на камерах, чтобы быстрее замечать конфликты. Какой вопрос самый важный до запуска?',
                answer: 'Какие данные собираются, кто их видит, как долго хранят и можно ли оспорить вывод',
                options: ['Достаточно ли точно система распознает конфликты на видео', 'Поможет ли система быстрее сообщать учителям о проблемах', 'Можно ли ограничиться камерами в коридорах без отдельного обсуждения данных'],
                feedback: 'Верно: даже полезная цель не отменяет приватность, прозрачность и право человека на пересмотр автоматического вывода.'
            }
        ];

        let quizOrder = [];
        let quizIndex = 0;
        let quizScore = 0;
        let waitingForNext = false;
        const quizQuestion = document.getElementById('quizQuestion');
        const quizOptions = document.getElementById('quizOptions');
        const quizFeedback = document.getElementById('quizFeedback');
        const quizCounter = document.getElementById('quizCounter');
        const quizScoreLabel = document.getElementById('quizScore');

        function shuffle(items) {
            const result = [...items];
            for (let index = result.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }
            return result;
        }

        function startQuiz() {
            quizOrder = shuffle(quizQuestions);
            quizIndex = 0;
            quizScore = 0;
            waitingForNext = false;
            renderQuizQuestion();
        }

        function renderQuizQuestion() {
            const current = quizOrder[quizIndex];
            const options = shuffle([current.answer, ...current.options]);
            quizCounter.textContent = `Вопрос ${quizIndex + 1} / ${quizOrder.length}`;
            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;
            quizQuestion.textContent = `Ситуация: ${current.question}`;
            quizFeedback.textContent = 'Выберите ответ.';
            quizOptions.innerHTML = '';
            waitingForNext = false;

            options.forEach((text) => {
                const button = document.createElement('button');
                button.className = 'quiz-option';
                button.type = 'button';
                button.textContent = text;
                button.onclick = () => answerQuiz(button, text === current.answer, current.feedback);
                quizOptions.appendChild(button);
            });
        }

        function answerQuiz(selectedButton, isCorrect, feedback) {
            if (waitingForNext) return;
            waitingForNext = true;

            document.querySelectorAll('.quiz-option').forEach((button) => {
                button.disabled = true;
                if (button.textContent === quizOrder[quizIndex].answer) button.classList.add('correct');
            });

            if (isCorrect) {
                quizScore += 1;
                selectedButton.classList.add('correct');
                quizFeedback.textContent = feedback;
            } else {
                selectedButton.classList.add('wrong');
                quizFeedback.textContent = `${feedback} Правильный ответ: ${quizOrder[quizIndex].answer}`;
            }

            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;

            window.setTimeout(() => {
                quizIndex += 1;
                if (quizIndex >= quizOrder.length) {
                    quizCounter.textContent = 'Квиз завершен';
                    quizQuestion.textContent = `Результат: ${quizScore} из ${quizOrder.length}`;
                    quizOptions.innerHTML = '<button class="quiz-option" type="button" id="restartQuiz">Пройти еще раз в новом порядке</button>';
                    quizFeedback.textContent = quizScore >= 8
                        ? 'Отличный результат: ты уверенно различаешь ответственность, справедливость и прозрачность.'
                        : 'Хорошая тренировка. Попробуй еще раз: вопросы и варианты снова перемешаются.';
                    document.getElementById('restartQuiz').onclick = startQuiz;
                    waitingForNext = false;
                    return;
                }
                renderQuizQuestion();
            }, 1900);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') changeSlide(1);
            if (event.key === 'ArrowLeft') changeSlide(-1);
        });

        renderCase('medicine');
        startQuiz();
        updateUI();

        const canvas = document.getElementById('network-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = Array.from({ length: 46 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.36,
                vy: (Math.random() - 0.5) * 0.36
            }));
        }

        function drawNetwork() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(23, 32, 51, 0.08)';
            ctx.fillStyle = 'rgba(79, 70, 229, 0.16)';

            particles.forEach((point, index) => {
                point.x += point.vx;
                point.y += point.vy;
                if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
                if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();

                for (let next = index + 1; next < particles.length; next++) {
                    const other = particles[next];
                    const distance = Math.hypot(point.x - other.x, point.y - other.y);
                    if (distance < 145) {
                        ctx.globalAlpha = 1 - distance / 145;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            });

            requestAnimationFrame(drawNetwork);
        }

        window.addEventListener('resize', initParticles);
        initParticles();
        drawNetwork();
  };

  /* Lesson 9-2 (9 класс - 2 урок) */
  LESSON_SCRIPTS['9-2'] = function() {
const slides=[...document.querySelectorAll(".slide")],bar=document.getElementById("progress");let current=0;
slides.forEach((slide,index)=>{const dot=document.createElement("button");const heading=slide.querySelector("h1,h2");const eyebrow=slide.querySelector(".eyebrow");let title=eyebrow?eyebrow.innerText.trim().replace(/\s+/g," "):"";if(title.includes("·"))title=title.split("·").slice(1).join("·").trim();if(!title||title==="9 класс"||title.toLowerCase().includes("урок"))title=heading?heading.innerText.trim().replace(/\s+/g," "):`Слайд ${index+1}`;if(title.length>32)title=title.slice(0,32).trim()+"…";dot.type="button";dot.className="dotbutton";dot.dataset.tooltip=`Слайд ${index+1}: ${title}`;dot.setAttribute("aria-label",`Слайд ${index+1}: ${title}`);dot.onclick=()=>show(index);document.getElementById("dots").append(dot)});
const heroOctets=[...document.querySelectorAll(".ipbig span")];
function flipMarkup(newValue,oldValue){return '<i class="ip-half flip-top"><em>'+newValue+'</em></i><i class="ip-half flip-bottom"><em>'+newValue+'</em></i><i class="flip-leaf"><em>'+oldValue+'</em></i>'}
function randomizeHeroIp(){heroOctets.forEach((octet,index)=>{const oldValue=octet.dataset.value||octet.textContent.trim(),newValue=Math.floor(Math.random()*256);octet.dataset.value=newValue;octet.innerHTML=flipMarkup(newValue,oldValue);octet.style.setProperty("--flip-delay",(index*90)+"ms");octet.classList.remove("refresh");void octet.offsetWidth;octet.classList.add("refresh")})}
randomizeHeroIp();
setInterval(randomizeHeroIp,2200);
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>{s.classList.toggle("active",n===current);s.setAttribute("aria-hidden",n!==current)});document.querySelectorAll(".dotbutton").forEach((dot,n)=>{if(n===current)dot.setAttribute("aria-current","step");else dot.removeAttribute("aria-current")});slides[current].scrollTop=0;bar.style.width=((current+1)/slides.length*100)+"%";history.replaceState(null,"","#"+(current+1))}
document.addEventListener("keydown",e=>{const typing=["INPUT","TEXTAREA"].includes(document.activeElement.tagName);if(!typing&&["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();show(current-1)}});
document.querySelectorAll(".myth").forEach(x=>x.onclick=()=>x.classList.toggle("open"));
const recallBank=[
{q:"Что называют искусственным интеллектом?",a:"Системы, которые распознают, прогнозируют и решают интеллектуальные задачи",w:["Любую программу, которая строго выполняет заранее записанные команды","Только нейронную сеть, способную разговаривать с человеком","Физического робота независимо от возможностей его программы"]},
{q:"Назовите одну пользу и один риск ИИ.",a:"Быстрая диагностика — польза; ошибочное решение — риск",w:["Автоматизация — только риск; сбор данных — только польза","Высокая скорость ответа — польза; использование электричества — главный этический риск","Замена любого решения человека — польза; ответственность разработчика — риск"]},
{q:"Почему решение ИИ может быть несправедливым?",a:"Из-за неполных или предвзятых данных и отсутствия проверки человеком",w:["Потому что любое автоматическое решение обязательно несправедливо","Только из-за ошибки пользователя, данные и модель здесь ни при чём","Потому что одинаковое правило всегда гарантирует справедливый результат"]},
{q:"Кто отвечает за решение, предложенное ИИ?",a:"Люди и организации, которые создали, внедрили и применили систему",w:["Только разработчик, даже если систему неправильно использовали","Только пользователь, потому что он нажал кнопку","Сам алгоритм, так как окончательный ответ сформировал именно он"]},
{q:"Что значит «прозрачность алгоритма»?",a:"Можно понять, какие данные и критерии привели к результату",w:["Исходный код программы обязательно опубликован в интернете","Система всегда показывает пользователю процент уверенности","Алгоритм одинаково обрабатывает все данные, но не объясняет решение"]},
{q:"Как цифровая этика связана с IP-адресом?",a:"IP входит в цифровой след, поэтому важны приватность и безопасность данных",w:["По одному IP всегда можно точно установить личность и домашний адрес","IP не относится к персональным данным ни при каких обстоятельствах","Публикация IP всегда безопасна, потому что это всего лишь четыре числа"]}
];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let recallOrder=[],recallIndex=0,recallPoints=0,recallLocked=false;
function renderRecall(){const item=recallOrder[recallIndex];recallLocked=false;recallCount.textContent="Вопрос "+(recallIndex+1)+" / "+recallOrder.length;recallScore.textContent="Верно: "+recallPoints;recallQuestion.textContent=item.q;recallFeedback.textContent="Выберите наиболее точный ответ.";recallNext.hidden=true;recallOptions.innerHTML="";shuffle([item.a,...item.w]).forEach(text=>{const b=document.createElement("button");b.className="recalloption";b.textContent=text;b.onclick=()=>answerRecall(b,item);recallOptions.appendChild(b)})}
function answerRecall(button,item){if(recallLocked)return;recallLocked=true;const ok=button.textContent===item.a;if(ok)recallPoints++;document.querySelectorAll(".recalloption").forEach(b=>{b.disabled=true;if(b.textContent===item.a)b.classList.add("correct")});if(!ok)button.classList.add("wrong");recallScore.textContent="Верно: "+recallPoints;recallFeedback.textContent=ok?"Верно — смысл выбран точно.":"Сравните формулировки: зелёным отмечен точный ответ.";recallNext.hidden=false;recallNext.textContent=recallIndex===recallOrder.length-1?"Завершить тест":"Следующий →"}
function startRecall(){recallOrder=shuffle([...recallBank]);recallIndex=0;recallPoints=0;recallNext.onclick=nextRecall;renderRecall()}
function finishRecall(){recallCount.textContent="Тест завершён";recallScore.textContent="Результат: "+recallPoints+" / 6";recallQuestion.textContent=recallPoints>=5?"Отлично! Прошлая тема усвоена.":recallPoints>=3?"Неплохо. Обсудите ошибки перед новой темой.":"Стоит коротко повторить социальные и этические аспекты ИИ.";recallOptions.innerHTML="";recallFeedback.textContent="Ответы сохранены до повторного запуска.";recallNext.hidden=false;recallNext.textContent="Пройти тест ещё раз ↻";recallNext.onclick=startRecall}
function nextRecall(){if(recallIndex<recallOrder.length-1){recallIndex++;renderRecall()}else finishRecall()}
recallNext.onclick=nextRecall;
document.querySelectorAll(".octet").forEach((x,i)=>x.onclick=()=>{document.querySelectorAll(".octet").forEach(y=>y.classList.remove("active"));x.classList.add("active");octetInfo.textContent=(i+1)+"-й октет: "+x.querySelector("strong").textContent+"₁₀ = "+x.dataset.bits+"₂ · 8 бит"});
function inspect(v){const p=v.trim().split("."),valid=p.length===4&&p.every(x=>/^\d{1,3}$/.test(x)&&+x>=0&&+x<=255&&String(+x)===x);if(!valid)return{ok:false,msg:"Некорректный IPv4: нужны 4 числа от 0 до 255, разделённые точками."};const n=p.map(Number),priv=n[0]===10||(n[0]===172&&n[1]>=16&&n[1]<=31)||(n[0]===192&&n[1]===168);return{ok:true,msg:priv?"Корректный частный IPv4: используется внутри локальной сети.":"Корректный IPv4. Он не относится к трём основным частным диапазонам."}}
function validate(){const r=inspect(ipInput.value);ipResult.textContent=r.msg;ipResult.className="result "+(r.ok?"good":"bad")}
validateIp.onclick=validate;ipInput.onkeydown=e=>{if(e.key==="Enter")validate()};document.querySelectorAll("#examples .choice").forEach(x=>x.onclick=()=>{ipInput.value=x.textContent;validate()});
document.querySelectorAll(".worktab").forEach(tab=>tab.onclick=()=>{document.querySelectorAll(".worktab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".workpanel").forEach(x=>x.classList.remove("active"));tab.classList.add("active");document.getElementById(tab.dataset.panel).classList.add("active")});
function mixBuildPieces(build){const box=build.querySelector(".pieces");shuffle([...box.children]).forEach(piece=>box.appendChild(piece))}
document.querySelectorAll(".build").forEach(build=>{build._parts=[];mixBuildPieces(build);build.querySelectorAll(".piece").forEach(piece=>piece.onclick=()=>{if(build._parts.length===build.querySelectorAll(".piece").length)return;build._parts.push(piece.textContent);piece.classList.add("used");build.querySelector(".buildstatus").textContent=build._parts.join("");build.classList.remove("ok","no")})});
function clearBuilds(){document.querySelectorAll(".build").forEach(build=>{build._parts=[];build.classList.remove("ok","no");build.querySelector(".buildstatus").textContent="";build.querySelectorAll(".piece").forEach(x=>x.classList.remove("used"));mixBuildPieces(build)});buildScore.textContent=""}
checkBuild.onclick=()=>{let pts=0;document.querySelectorAll(".build").forEach(build=>{const address=build._parts.join(""),complete=build._parts.length===build.querySelectorAll(".piece").length,ok=complete&&inspect(address).ok;build.classList.remove("ok","no");build.classList.add(ok?"ok":"no");build.querySelector(".buildstatus").textContent=address+(ok?"  ✓":"  ✕");if(ok)pts++});buildScore.textContent="Сборка: "+pts+" / 5"};
resetBuild.onclick=clearBuilds;
document.querySelectorAll(".task .choice").forEach(x=>x.onclick=()=>{x.closest(".choices").querySelectorAll(".choice").forEach(y=>y.classList.remove("selected"));x.classList.add("selected");x.closest(".task").classList.remove("correct","wrong")});
check.onclick=()=>{let pts=0,answered=0;document.querySelectorAll("#ipquiz .task").forEach(t=>{const x=t.querySelector(".selected");t.classList.remove("correct","wrong");if(!x)return;answered++;const ok=x.dataset.value===t.dataset.answer;t.classList.add(ok?"correct":"wrong");if(ok)pts++});feedback.textContent=answered<5?"Ответьте ещё на "+(5-answered)+" задан. Сейчас: "+pts+" / 5":"Вопросы: "+pts+" / 5"};
reset.onclick=()=>{document.querySelectorAll("#ipquiz .task").forEach(t=>t.classList.remove("correct","wrong"));document.querySelectorAll("#ipquiz .choice").forEach(x=>x.classList.remove("selected"));feedback.textContent=""};
startRecall();show(Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1)));
  };

  /* Lesson 9-3 (9 класс - 3 урок) */
  LESSON_SCRIPTS['9-3'] = function() {
(()=>{const all=[...document.querySelectorAll('.slide')];all[0].querySelector('.bigicon').className='bigicon pc-icons';all[0].querySelector('.bigicon').innerHTML='<span>💻</span><span>🖥️</span>';
const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),shuffle=a=>a.sort(()=>Math.random()-.5),ip=()=>[r(100,223),r(100,223),r(100,223),r(100,223)].join('.');
const split=(value,count)=>{const cuts=[];while(cuts.length<count-1){const n=r(1,value.length-1);if(!cuts.includes(n))cuts.push(n)}cuts.sort((a,b)=>a-b);return [0,...cuts,value.length].slice(0,-1).map((n,i)=>value.slice(n,[...cuts,value.length][i]))};
const addresses=[ip(),ip(),ip()],fragments=[addresses[0].split(/(?<=\.)/),[...split(addresses[1].split('.')[0],2).map((x,i)=>i===1?x+'.':x),...addresses[1].split('.').slice(1).map((x,i)=>i<2?x+'.':x)],[addresses[2].split('.')[0]+'.',...split(addresses[2].split('.')[1],2).map((x,i)=>i===1?x+'.':x),addresses[2].split('.')[2]+'.',...split(addresses[2].split('.')[3],2)]];
document.getElementById('builders').innerHTML=fragments.map((parts,i)=>'<div class="build" data-answer="'+addresses[i]+'"><div><strong>Пакет '+(i+1)+' · '+['легко','разогрев','средне'][i]+'</strong><div class="small">'+[4,5,6][i]+' фрагментов, адрес новый при каждом открытии</div></div><div class="pieces">'+shuffle(parts).map(x=>'<button class="piece">'+x+'</button>').join('')+'</div><span class="buildstatus"></span></div>').join('')+'<div class="controlsrow"><button class="action" id="checkBuild">Проверить все три</button></div><div class="result" id="buildScore">Используй все фрагменты. Адреса и порядок фрагментов меняются при каждом открытии.</div>';
all[2].querySelector('.wrap').innerHTML='<header class="slidehead"><span class="eyebrow">03 / 05 · Что такое протокол</span><button class="action advance" data-next>Далее</button></header><h2>У интернета есть правила</h2><div class="definition" style="margin:0 0 20px"><strong>Сетевой протокол — это набор правил, по которым устройства обмениваются данными.</strong> Он задаёт, как отправить сообщение и как его понять.</div><div class="protocol-demo" id="protocolDemo" data-phase="0"><div class="demohead"><h3>От сообщения до доставки</h3><div class="demotools"><button class="action" id="playDelivery">Запустить</button><button class="action secondary" id="stepDelivery">По шагам</button><button class="choice" id="resetDelivery">Сначала</button></div></div><div class="stations"><div class="station"><span class="screen">💬</span><strong>Компьютер 1 · отправитель</strong><code>192.168.1.7</code></div><div class="station"><span class="screen receiver">💻</span><strong>Компьютер 2 · получатель</strong><code>192.168.1.25</code></div></div><div class="shipment"><div class="demo-message" id="demoMessage">«ПРИВЕТ, ДРУГ!»</div><div class="demo-packets"><div class="demo-packet"><strong>№ 1 · ПРИ</strong><small class="packet-address">Кому: 192.168.1.25</small></div><div class="demo-packet"><strong>№ 2 · ВЕТ,</strong><small class="packet-address">Кому: 192.168.1.25</small></div><div class="demo-packet"><strong>№ 3 · ДРУГ!</strong><small class="packet-address">Кому: 192.168.1.25</small></div></div></div><div class="road"><div class="ack">Получение подтверждено ✓</div><div class="truck" id="deliveryTruck"><div class="trailer"><div class="truckload"><span>1</span><span>2</span><span>3</span></div>TCP/IP</div><div class="cab"></div><div class="wheel back"></div><div class="wheel front"></div></div></div><p class="demo-caption" id="deliveryCaption">1 / 6. Компьютер 1 хочет отправить сообщение «ПРИВЕТ, ДРУГ!» компьютеру 2.</p><details class="demo-foot"><summary>Как читать эту модель</summary><p>Грузовик — учебная аналогия передачи данных. IP указывает адреса, TCP следит за порядком и получением.</p></details></div><div class="grid2"><div class="card peach"><h3 class="protocolword">IP — доставить по адресу</h3><span class="en">Internet Protocol · интернет-протокол</span><p><strong>IP — протокол адресации и передачи пакетов между сетями.</strong></p><p>Пакет — небольшая порция данных с адресом получателя.</p><span class="stepchip">Как адрес на посылке</span></div><div class="card sage"><h3 class="protocolword">TCP — собрать без пропусков</h3><span class="en">Transmission Control Protocol</span><p><strong>TCP — протокол надёжной передачи данных в правильном порядке.</strong></p><p>Контролирует получение и повторно передаёт потерянные данные.</p><span class="stepchip">Как проверка: всё ли пришло?</span></div></div></div>';
all[3].querySelector('.wrap').innerHTML='<header class="slidehead"><span class="eyebrow">04 / 05 · Мини-исследование</span><button class="action advance" data-next>Далее</button></header><h2>Исследуем протоколы</h2><p class="lead">Работа в паре · 15–20 минут · результат — таблица в тетради и короткий вывод.</p><div class="grid2"><div class="paper"><span class="tag">Задание в тетради</span><h3>Составьте сравнительную таблицу</h3><table class="research-table"><thead><tr><th>Протокол</th><th>Для чего нужен</th><th>Пример ситуации</th><th>Что будет без него?</th></tr></thead><tbody><tr><td><code>IP</code></td><td></td><td></td><td></td></tr><tr><td><code>TCP</code></td><td></td><td></td><td></td></tr><tr><td><code>FTP</code></td><td></td><td></td><td></td></tr><tr><td><code>HTTPS</code></td><td></td><td></td><td></td></tr></tbody></table><p class="small">Перерисуйте таблицу в тетрадь; в каждой ячейке достаточно одной точной фразы.</p></div><div class="card sage"><span class="tag">План исследования</span><ol class="research-steps"><li><strong>Распределите роли:</strong> исследователь и секретарь.</li><li>По материалам третьего слайда заполните первые два столбца.</li><li>Придумайте свои школьные примеры: дневник, отправка файла, видеосвязь, школьный сайт.</li><li>Для каждой строки ответьте: «Что сломается или станет опасным без этого протокола?»</li><li><strong>Вывод:</strong> внизу таблицы напишите 2 предложения: чем IP отличается от TCP и почему HTTPS важнее обычного HTTP при входе в аккаунт.</li></ol><div class="definition"><strong>Защита:</strong> каждая пара называет один пример и объясняет свой выбор за 30 секунд.</div></div></div></div>';
let phase=0,timer;const text=['1 / 6. Компьютер 1 хочет отправить сообщение «ПРИВЕТ, ДРУГ!» компьютеру 2.','2 / 6. TCP делит сообщение на части и задаёт им порядок.','3 / 6. Части упакованы в IP-пакеты с адресом получателя 192.168.1.25.','4 / 6. Пакеты едут: IP отвечает за адрес, TCP — за надёжность передачи.','5 / 6. Компьютер 2 получил пакеты. TCP проверяет порядок и наличие всех частей.','6 / 6. Получатель собрал сообщение и подтвердил получение.'];const demo=document.getElementById('protocolDemo'),caption=document.getElementById('deliveryCaption');const draw=()=>{demo.dataset.phase=phase;caption.textContent=text[phase];document.getElementById('playDelivery').textContent=phase===5?'Ещё раз':'Запустить'};const reset=()=>{clearTimeout(timer);phase=0;draw()};const run=()=>{clearTimeout(timer);if(phase===5)phase=0;const next=()=>{draw();if(phase<5){phase++;timer=setTimeout(next,phase===3?4000:2100)}};next()};document.getElementById('playDelivery').onclick=run;document.getElementById('stepDelivery').onclick=()=>{clearTimeout(timer);phase=(phase+1)%6;draw()};document.getElementById('resetDelivery').onclick=reset;draw()})();

(()=>{const slide=document.querySelectorAll('.slide')[3];slide.querySelector('.wrap').innerHTML='<header class="slidehead"><span class="eyebrow">04 / 05 · Протоколы в жизни</span><button class="action advance" data-next>Далее</button></header><h2>Загрузить файл или открыть сайт?</h2><div class="grid2"><div class="card"><div class="bigicon">📁</div><h3 class="protocolword">FTP — передача файлов</h3><span class="en">File Transfer Protocol</span><p><strong>Протокол обмена файлами между компьютером и сервером.</strong></p><p>Например, загрузить папку с работами на файловый сервер.</p><p class="small">Обычный FTP не шифрует файлы и пароль.</p></div><div class="card"><div class="bigicon">🔒</div><h3 class="protocolword">HTTPS — защищённый веб</h3><span class="en">HTTP с защитой TLS</span><p><strong>Протокол защищённого обмена данными между браузером и сайтом.</strong></p><p>Например, безопасно передать пароль при входе в электронный дневник.</p><p class="small">TLS шифрует данные и защищает их от подмены.</p></div></div><div class="paper" style="margin-top:20px"><span class="tag">Мини-исследование · 15–20 минут · работа в паре</span><h3>Сравните четыре протокола в тетради</h3><p>Один ученик — исследователь: ищет ответ в материалах урока и приводит школьный пример. Второй — секретарь: заполняет таблицу. Затем поменяйтесь ролями.</p><table class="research-table"><thead><tr><th>Протокол</th><th>Для чего нужен</th><th>Пример работы</th><th>Что будет без него?</th></tr></thead><tbody><tr><td><code>IP</code></td><td></td><td></td><td></td></tr><tr><td><code>TCP</code></td><td></td><td></td><td></td></tr><tr><td><code>FTP</code></td><td></td><td></td><td></td></tr><tr><td><code>HTTPS</code></td><td></td><td></td><td></td></tr></tbody></table><div class="definition"><strong>Финальный вывод:</strong> под таблицей напишите 2 предложения: чем IP отличается от TCP и почему HTTPS нужен для электронного дневника. Подготовьте один пример для защиты за 30 секунд.</div></div></div>'})();

(()=>{const lesson=[...document.querySelectorAll('.slide')],protocol=lesson[2],life=lesson[3],finish=lesson[4];
protocol.querySelector('.wrap').insertAdjacentHTML('beforeend','<div class="definition"><strong>TCP/IP — семейство протоколов для работы сетей.</strong> В паре IP + TCP один отвечает за адресацию и доставку пакетов, другой — за надёжность и порядок данных.</div>');
life.querySelector('.paper').remove();
life.querySelector('.wrap').insertAdjacentHTML('beforeend','<div class="paper" style="margin-top:20px"><span class="tag">Факты и примеры</span><h3>Почему важно не путать FTP и HTTPS?</h3><p><strong>FTP</strong> удобен для передачи файлов на сервер, но обычный FTP не защищает пароль и содержимое файла. Для важных данных используют защищённые варианты передачи.</p><p><strong>HTTPS</strong> нужен, когда браузер обменивается данными с сайтом: например, при входе в электронный дневник, оплате или отправке формы. Значок замка означает защищённое соединение, но всё равно проверяй адрес сайта.</p><p class="small">Пример: архив с проектом для школьного сервера — задача передачи файла; пароль от дневника — задача защищённого веб-соединения.</p></div>');
life.querySelector('.eyebrow').textContent='04 / 06 · Протоколы в жизни';
const research=document.createElement('section');research.className='slide';research.setAttribute('aria-label','Мини-исследование');research.innerHTML='<div class="wrap"><header class="slidehead"><span class="eyebrow">05 / 06 · Мини-исследование</span><button class="action advance" data-next>Далее</button></header><h2>Исследуем протоколы</h2><p class="lead">Индивидуальная работа · 15–20 минут · результат — таблица в тетради.</p><div class="paper"><span class="tag">Задание в тетради</span><h3>Сравните четыре протокола</h3><table class="research-table"><thead><tr><th>Протокол</th><th>Для чего нужен</th><th>Пример работы</th><th>Что будет без него?</th></tr></thead><tbody><tr><td><code>IP</code></td><td></td><td></td><td></td></tr><tr><td><code>TCP</code></td><td></td><td></td><td></td></tr><tr><td><code>FTP</code></td><td></td><td></td><td></td></tr><tr><td><code>HTTPS</code></td><td></td><td></td><td></td></tr></tbody></table><div class="definition"><strong>Финальный вывод:</strong> под таблицей напишите 2 предложения: чем IP отличается от TCP и почему HTTPS нужен для электронного дневника. Подготовьте один пример для защиты за 30 секунд.</div></div></div>';
research.querySelector('.lead').textContent='Работа в паре · 15–20 минут · результат — сравнительная таблица в тетради.';
const table=research.querySelector('.research-table');table.querySelector('thead tr').insertAdjacentHTML('beforeend','<th>Полное название АНГЛ - РУС</th>');table.querySelectorAll('tbody tr').forEach(row=>row.insertAdjacentHTML('beforeend','<td></td>'));research.querySelector('.definition').remove();
finish.before(research);finish.querySelector('.eyebrow').textContent='06 / 06 · Финиш';})();

'use strict';const $=id=>document.getElementById(id),slides=[...document.querySelectorAll('.slide')];let current=0;slides.forEach((s,i)=>{const b=document.createElement('button');b.className='dotbutton';b.title=`Слайд ${i+1}: ${s.getAttribute('aria-label')}`;b.dataset.tooltip=b.title;b.onclick=()=>show(i);$('dots').append(b);s.querySelector('[data-next]').onclick=()=>show(i===slides.length-1?0:i+1)});function show(n){current=Math.max(0,Math.min(n,slides.length-1));slides.forEach((s,i)=>s.classList.toggle('active',i===current));document.querySelectorAll('.dotbutton').forEach((b,i)=>b.toggleAttribute('aria-current',i===current));slides[current].scrollTop=0;$('progress').style.width=((current+1)/slides.length*100)+'%';history.replaceState(null,'','#'+(current+1))}window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1))||1)-1));document.addEventListener('keydown',e=>{if(e.target.closest('button,input,summary')||e.ctrlKey||e.altKey||e.metaKey)return;if(e.key==='ArrowRight'||e.key==='PageDown')show(current+1);if(e.key==='ArrowLeft'||e.key==='PageUp')show(current-1)});
function valid(v){const a=v.split('.');return a.length===4&&a.every(x=>/^(0|[1-9]\d{0,2})$/.test(x)&&+x<=255)}const builds=[...document.querySelectorAll('.build')];builds.forEach(b=>{b.parts=[];const pcs=[...b.querySelectorAll('.piece')],out=b.querySelector('.buildstatus'),tools=document.createElement('div');tools.className='buildtools';tools.innerHTML='<button class="choice">Убрать последний</button><button class="choice">Сначала</button>';b.append(tools);const draw=()=>{out.textContent=b.parts.map(x=>x.textContent).join('');pcs.forEach(x=>x.disabled=b.parts.includes(x))};pcs.forEach(x=>x.onclick=()=>{b.parts.push(x);draw()});tools.children[0].onclick=()=>{b.parts.pop();draw()};tools.children[1].onclick=()=>{b.parts=[];draw()};draw()});$('checkBuild').onclick=()=>{let n=0;builds.forEach(b=>{const v=b.parts.map(x=>x.textContent).join(''),ok=b.parts.length===4&&valid(v);n+=+ok;b.classList.toggle('correct',ok);b.classList.toggle('wrong',!ok);b.querySelector('.buildstatus').textContent=(v||'Адрес ещё не собран')+(ok?' ✓':' — проверь запись')});$('buildScore').className='result '+(n===3?'good':'bad');$('buildScore').textContent=`Верно: ${n} из 3. `+(n===3?'Во всех адресах четыре октета от 0 до 255.':'Проверь порядок фрагментов и диапазон каждого октета.')};
let task,done=new Set;document.querySelectorAll('[data-answer]').forEach(x=>x.onclick=()=>{task=x;document.querySelectorAll('[data-answer]').forEach(y=>y.classList.remove('selected'));x.classList.add('selected');$('practiceResult').className='result';$('practiceResult').textContent='Теперь выбери подходящий протокол.'});document.querySelectorAll('[data-protocol]').forEach(x=>x.onclick=()=>{if(!task){$('practiceResult').textContent='Сначала выбери одну ситуацию.';return}const ok=x.dataset.protocol===task.dataset.answer;if(ok)done.add(task.dataset.answer);task.classList.toggle('correct',ok);task.classList.toggle('wrong',!ok);$('practiceResult').className='result '+(ok?'good':'bad');$('practiceResult').textContent=ok?'Верно! '+({IP:'IP указывает адрес получателя.',TCP:'TCP следит за порядком и получением частей.',FTP:'FTP служит для передачи файлов.',HTTPS:'HTTPS защищает обмен браузера с сайтом.'})[x.dataset.protocol]:'Попробуй ещё раз: подумай, какая задача описана.';$('practiceScore').textContent=`Решено: ${done.size} из 4`});
const quiz=[['Какой протокол указывает адрес получателя пакета?',['TCP','IP','FTP'],1,'IP отвечает за адресацию и передачу пакетов.'],['Какой протокол проверяет порядок и получение данных?',['HTTPS','TCP','IP'],1,'TCP обеспечивает надёжную передачу.'],['Что используют для защищённого входа на сайт?',['FTP','HTTPS','IP'],1,'HTTPS защищает обмен браузера и сайта.']];let qi=0,qs=0;function qdraw(){const q=quiz[qi];$('quizCount').textContent=`Вопрос ${qi+1} из ${quiz.length} · верно ${qs}`;$('quizQuestion').textContent=q[0];$('quizOptions').innerHTML='';$('quizFeedback').className='result';$('quizFeedback').textContent='Выбери один ответ.';$('quizNext').hidden=true;q[1].forEach((v,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=v;b.onclick=()=>{const ok=i===q[2];if(ok)qs++;[...$('quizOptions').children].forEach((x,n)=>{x.disabled=true;if(n===q[2])x.classList.add('correct')});if(!ok)b.classList.add('wrong');$('quizFeedback').className='result '+(ok?'good':'bad');$('quizFeedback').textContent=(ok?'Верно! ':'Разберёмся: ')+q[3];$('quizNext').hidden=false;$('quizNext').textContent=qi===quiz.length-1?'Пройти ещё раз':'Следующий вопрос'};$('quizOptions').append(b)})}$('quizNext').onclick=()=>{if(qi<quiz.length-1){qi++;qdraw()}else{qi=0;qs=0;qdraw()}};qdraw();show((parseInt(location.hash.slice(1))||1)-1);

/* В каждом пакете может быть разное число фрагментов. */
document.getElementById('checkBuild').onclick=()=>{let score=0;document.querySelectorAll('.build').forEach(b=>{const value=b.parts.map(x=>x.textContent).join(''),partsReady=b.parts.length===b.querySelectorAll('.piece').length,octets=value.split('.'),ok=partsReady&&octets.length===4&&octets.every(x=>/^(0|[1-9]\d{0,2})$/.test(x)&&Number(x)<=255);score+=+ok;b.classList.toggle('correct',ok);b.classList.toggle('wrong',!ok);b.querySelector('.buildstatus').textContent=(value||'Адрес ещё не собран')+(ok?' ✓':' — проверь порядок фрагментов и октеты')});const result=document.getElementById('buildScore');result.className='result '+(score===3?'good':'bad');result.textContent=`Верно: ${score} из 3. `+(score===3?'Все собранные записи — корректные IPv4-адреса.':'У IP-адреса четыре октета от 0 до 255; используй все фрагменты.')};
  };

  /* Lesson 9-4 (9 класс - 4 урок) */
  LESSON_SCRIPTS['9-4'] = function() {
'use strict';
      const $=id=>document.getElementById(id),slides=[...document.querySelectorAll('.slide')];
      let current=0;
      slides.forEach((s,i)=>{
        const b=document.createElement('button');
        b.className='dotbutton';
        b.title=`Слайд ${i+1}: ${s.getAttribute('aria-label')}`;
        b.setAttribute('aria-label', b.title);
        b.dataset.tooltip=b.title;
        b.onclick=()=>show(i);
        $('dots').append(b);
        s.querySelector('[data-next]').onclick=()=>show(i===slides.length-1?0:i+1)
      });
      function show(n){
        current=Math.max(0,Math.min(n,slides.length-1));
        slides.forEach((s,i)=>s.classList.toggle('active',i===current));
        document.querySelectorAll('.dotbutton').forEach((b, i) => {
          if (i === current) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
        slides[current].scrollTop=0;
        $('progress').style.width=((current+1)/slides.length*100)+'%';
        history.replaceState(null,'','#'+(current+1))
      }
      window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1))||1)-1));
      document.addEventListener('keydown',e=>{
        if(e.target.closest('button,input,summary')||e.ctrlKey||e.altKey||e.metaKey)return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          show(current + 1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          show(current - 1);
        }
      });

      // Повторение: вопросы идут по порядку, варианты перемешиваются.
      const reviewQuestions = [
        {
          question: 'Какая запись является корректным IPv4-адресом?',
          options: ['192.168.1.25', '192.168.1.256', '192.168.25', '192.168.1.25.7'],
          answer: '192.168.1.25',
          explanation: 'IPv4 записывают как четыре числа от 0 до 255, разделённые точками. Каждое число — октет из 8 бит.'
        },
        {
          question: 'Какой протокол отвечает за адресацию и передачу пакетов между сетями?',
          options: ['TCP', 'IP', 'FTP', 'HTTPS'],
          answer: 'IP',
          explanation: 'IP задаёт адреса отправителя и получателя пакета. По адресу получателя пакет направляют в нужную сеть.'
        },
        {
          question: 'Какой протокол обеспечивает надёжную передачу данных в правильном порядке?',
          options: ['IP', 'FTP', 'TCP', 'HTTPS'],
          answer: 'TCP',
          explanation: 'TCP контролирует получение данных, организует повторную передачу потерянных частей и их сборку в правильном порядке.'
        },
        {
          question: 'Какой из изученных протоколов специально предназначен для обмена файлами с файловым сервером?',
          options: ['HTTPS', 'TCP', 'FTP', 'IP'],
          answer: 'FTP',
          explanation: 'FTP — File Transfer Protocol, протокол передачи файлов. Обычный FTP не шифрует пароль и содержимое файлов.'
        },
        {
          question: 'Какой протокол защищает обмен между браузером и сайтом при входе в электронный дневник?',
          options: ['FTP', 'HTTPS', 'IP', 'TCP'],
          answer: 'HTTPS',
          explanation: 'HTTPS использует TLS для шифрования данных и защиты от подмены. Это защищает передачу пароля; адрес самого сайта всё равно нужно проверять.'
        }
      ];
      let reviewIndex = 0;
      let reviewScore = 0;
      let reviewAnswered = false;

      function shuffled(values) {
        const result = [...values];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      }

      function drawReview() {
        const question = reviewQuestions[reviewIndex];
        reviewAnswered = false;
        $('reviewCount').textContent = `Вопрос ${reviewIndex + 1} из 5 · верно: ${reviewScore}`;
        $('reviewQuestion').textContent = question.question;
        $('reviewOptions').replaceChildren();
        $('reviewFeedback').className = 'result';
        $('reviewFeedback').textContent = 'Выбери один из четырёх вариантов.';
        $('reviewNext').hidden = true;

        shuffled(question.options).forEach((option, index) => {
          const button = document.createElement('button');
          button.className = 'choice';
          button.textContent = `${index + 1}. ${option}`;
          button.dataset.option = option;
          button.onclick = () => {
            if (reviewAnswered) return;
            reviewAnswered = true;
            const correct = option === question.answer;
            if (correct) reviewScore++;
            [...$('reviewOptions').children].forEach(choice => {
              choice.disabled = true;
              if (choice.dataset.option === question.answer) {
                choice.classList.add('correct');
                choice.textContent += ' ✓';
              }
            });
            if (!correct) {
              button.classList.add('wrong');
              button.textContent += ' ✕';
            }
            $('reviewCount').textContent = `Вопрос ${reviewIndex + 1} из 5 · верно: ${reviewScore}`;
            $('reviewFeedback').className = 'result ' + (correct ? 'good' : 'bad');
            $('reviewFeedback').textContent = (correct ? 'Верно! ' : `Правильный ответ: ${question.answer}. `) + question.explanation;
            if (reviewIndex === reviewQuestions.length - 1) {
              $('reviewFeedback').textContent += ` Повторение завершено: ${reviewScore} из 5.`;
            }
            $('reviewNext').textContent = reviewIndex === reviewQuestions.length - 1 ? 'Повторить пять вопросов' : 'Следующий вопрос';
            $('reviewNext').hidden = false;
            $('reviewNext').focus({preventScroll: true});
          };
          $('reviewOptions').append(button);
        });
      }

      $('reviewNext').onclick = () => {
        if (!reviewAnswered) return;
        if (reviewIndex === reviewQuestions.length - 1) {
          reviewIndex = 0;
          reviewScore = 0;
        } else {
          reviewIndex++;
        }
        drawReview();
        $('reviewQuestion').focus({preventScroll: true});
      };
      drawReview();

      function splitMask(n){
        $('splitAddress').innerHTML=n===24?'<span class="network">192.168.1<small>часть сети</small></span><span class="host">.37<small>часть узла</small></span>':'<span class="network">192.168<small>часть сети</small></span><span class="host">.1.37<small>часть узла</small></span>';
        $('splitResult').textContent=n===24?'Маска 255.255.255.0: сеть 192.168.1.0. Последний октет относится к узлу.':'Маска 255.255.0.0: сеть 192.168.0.0. Два последних октета относятся к узлу.';
        document.querySelectorAll('[data-mask]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.mask===n))
      }
      document.querySelectorAll('[data-mask]').forEach(b=>b.onclick=()=>splitMask(+b.dataset.mask));
      splitMask(24);
      
      const bits = Array(8).fill(0);
      const bitSolved = new Set();
      let bitTarget = 128;
      function drawBits(){
        document.querySelectorAll('.bit').forEach((b,i)=>{
          b.querySelector('strong').textContent=bits[i];
          b.setAttribute('aria-pressed',!!bits[i]);
          b.setAttribute('aria-label', `Вес ${128 >> i}: бит ${bits[i]}`);
        });
        const w=bits.flatMap((v,i)=>v?[128>>i]:[]),v=w.reduce((a,b)=>a+b,0);
        $('binaryValue').textContent=bits.join('')+'₂ = '+(w.length?w.join(' + '):'0')+' = '+v
      }
      bits.forEach((_,i)=>{
        const b=document.createElement('button');
        b.className='bit';
        b.innerHTML=`<small>${128>>i}</small><strong>0</strong>`;
        b.onclick=()=>{
          bits[i]^=1;
          drawBits();
          $('bitFeedback').className = 'result';
          $('bitFeedback').textContent = `Собери ${bitTarget} и нажми «Проверить».`;
        };
        $('binaryBits').append(b)
      });
      $('zeroBits').onclick=()=>{
        bits.fill(0);
        drawBits();
        $('bitFeedback').className = 'result';
        $('bitFeedback').textContent = `Все биты выключены. Собери ${bitTarget}.`;
      };
      const bitTargetButtons = [...document.querySelectorAll('[data-bit-target]')];

      function selectBitTarget(value, resetFeedback = true) {
        bitTarget = value;
        bits.fill(0);
        drawBits();
        $('bitTarget').textContent = `Задание: собери ${bitTarget}`;
        if (resetFeedback) {
          $('bitFeedback').className = 'result';
          $('bitFeedback').textContent = 'Включи биты так, чтобы сумма их весов совпала с выбранным числом.';
        }
        bitTargetButtons.forEach(target => {
          target.setAttribute('aria-pressed', Number(target.dataset.bitTarget) === bitTarget);
        });
      }

      bitTargetButtons.forEach(button => {
        button.onclick = () => selectBitTarget(Number(button.dataset.bitTarget));
      });
      $('checkBits').onclick = () => {
        const value = parseInt(bits.join(''), 2);
        const correct = value === bitTarget;
        $('bitFeedback').className = 'result ' + (correct ? 'good' : 'bad');
        if (!correct) {
          $('bitFeedback').textContent = `Сейчас получилось ${value}, а нужно ${bitTarget}. Сложи веса включённых битов и измени набор.`;
          return;
        }

        const completed = bitTarget;
        const binary = bits.join('');
        const target = document.querySelector(`[data-bit-target="${completed}"]`);
        bitSolved.add(completed);
        target.classList.add('solved');
        target.innerHTML = `<span class="target-value">${completed}</span><code class="target-binary">${binary}₂</code>`;
        target.setAttribute('aria-label', `${completed}: собрано, двоичная запись ${binary}`);
        $('bitScore').textContent = `Собрано: ${bitSolved.size} из 5`;

        const currentIndex = bitTargetButtons.indexOf(target);
        const remaining = [
          ...bitTargetButtons.slice(currentIndex + 1),
          ...bitTargetButtons.slice(0, currentIndex)
        ];
        const next = remaining.find(button => !bitSolved.has(Number(button.dataset.bitTarget)));
        if (next) {
          selectBitTarget(Number(next.dataset.bitTarget), false);
          $('bitFeedback').textContent = `Верно: ${completed} = ${binary}₂. Теперь собери ${bitTarget} — биты уже обнулены.`;
        } else {
          $('bitFeedback').textContent = `Верно: ${completed} = ${binary}₂. Все пять чисел собраны! Двоичные записи сохранены в списке «Собери числа».`;
        }
      };
      drawBits();
      
      $('applyMask').onclick=()=>{
        $('networkRow').hidden = false;
        $('maskResult').className='result good';
        $('maskResult').textContent='Сеть: 192.168.1.0. Три октета под 255 сохранились, октет под 0 обнулился.'
      };
      
      let step=0;
      function bit(n){
        return n.toString(2).padStart(8,'0')
      }
      function drawStep(){
        const source=bit(150),result=bit(128),ready=step>=1,final=step>=2,rows=[['Вес',[128,64,32,16,8,4,2,1],'weights'],['IP: 150',source.split(''),''],['Маска','10000000'.split(''),ready?'':'pending'],['Итог',result.split(''),final?'':'pending']];
        $('bitTable').innerHTML=rows.map((r,ri)=>'<div class="mask-bit-row '+r[2]+'"><strong>'+r[0]+'</strong>'+r[1].map((v,i)=>'<span class="mask-bit-cell '+(ri===1?(i===0?'netbit':'hostbit'):'')+'">'+(r[2]==='pending'?'?':v)+'</span>').join('')+'</div>').join('');
        const copy=[['1. Записываем число в виде восьми битов','150 = 128 + 16 + 4 + 2, значит <strong>10010110</strong>.'],['2. Записываем маску','128 = <strong>10000000₂</strong>. Первая единица велит сохранить первый бит IP, семь нулей — заменить остальные биты нулями.'],['3. Накладываем маску','В первом столбце: <strong>1 AND 1 = 1</strong>. В остальных столбцах маска равна 0, поэтому результат — 0.'],['4. Читаем адрес сети','Последний октет стал <strong>128</strong>. Адрес сети: <strong class="mono">192.168.1.128</strong>.']];
        $('stepText').innerHTML='<h3>'+copy[step][0]+'</h3><p>'+copy[step][1]+'</p>';
        document.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.step===step));
        $('nextStep').textContent=step===3?'Сначала':'Дальше'
      }
      document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{
        step=+b.dataset.step;
        drawStep()
      });
      $('nextStep').onclick=()=>{
        step=step===3?0:step+1;
        drawStep()
      };
      $('resetStep').onclick=()=>{
        step=0;
        drawStep()
      };
      drawStep();
      
      // В каждой вкладке — три независимых примера с сохранением ввода.
      const tasks = [
        {
          title: 'Задание 1 · Сохраняем три октета',
          mask: '255.255.255.0',
          hint: 'Первые три октета остаются, последний становится 0.',
          examples: [
            {ip: '192.168.5.73', answer: '192.168.5.0'},
            {ip: '172.16.8.214', answer: '172.16.8.0'},
            {ip: '10.4.12.39', answer: '10.4.12.0'}
          ]
        },
        {
          title: 'Задание 2 · Сохраняем два октета',
          mask: '255.255.0.0',
          hint: 'Первые два октета остаются, два последних становятся 0.',
          examples: [
            {ip: '10.25.17.8', answer: '10.25.0.0'},
            {ip: '172.20.43.91', answer: '172.20.0.0'},
            {ip: '192.168.72.16', answer: '192.168.0.0'}
          ]
        },
        {
          title: 'Задание 3 · Работаем с битами последнего октета',
          mask: '255.255.255.128',
          hint: 'Первые три октета сохраняются. Переведи последний в 8 бит и наложи 10000000: сохрани только первый бит, остальные замени нулями.',
          examples: [
            {ip: '192.168.4.200', answer: '192.168.4.128'},
            {ip: '10.0.3.95', answer: '10.0.3.0'},
            {ip: '172.16.7.129', answer: '172.16.7.128'}
          ]
        }
      ];
      let taskIndex = 0;
      const practiceState = tasks.map(task => task.examples.map(() => ({
        value: '',
        solved: false,
        feedback: 'Вычисли и запиши адрес сети.',
        tone: ''
      })));

      function updatePracticeScore() {
        const total = practiceState.flat().filter(state => state.solved).length;
        const group = practiceState[taskIndex].filter(state => state.solved).length;
        $('taskScore').textContent = `В этой вкладке: ${group} из 3 · Всего решено: ${total} из 9`;
      }

      function drawTask() {
        const task = tasks[taskIndex];
        $('taskTitle').textContent = task.title;
        $('taskIntro').textContent = `Во всех трёх примерах маска ${task.mask}.`;
        $('taskExamples').replaceChildren();
        document.querySelectorAll('[data-task]').forEach(button => {
          button.setAttribute('aria-pressed', Number(button.dataset.task) === taskIndex);
        });

        task.examples.forEach((example, index) => {
          const state = practiceState[taskIndex][index];
          const card = document.createElement('form');
          const inputId = `answer-${taskIndex}-${index}`;
          card.className = 'card';
          card.innerHTML = `
            <h3>Пример ${index + 1}</h3>
            <p class="formula">IP: ${example.ip}</p>
            <p class="small">Маска: <code>${task.mask}</code></p>
            <label class="field" for="${inputId}">Адрес сети</label>
            <div class="field">
              <input id="${inputId}" autocomplete="off" spellcheck="false" aria-describedby="${inputId}-feedback" placeholder="Четыре числа через точки">
            </div>
            <div class="controlsrow">
              <button class="action" type="submit">Проверить</button>
              <button class="action secondary" type="button">Подсказка</button>
            </div>
            <div class="result" id="${inputId}-feedback" role="status"></div>
          `;
          const input = card.querySelector('input');
          const feedback = card.querySelector('.result');
          const renderFeedback = () => {
            feedback.className = 'result' + (state.tone ? ' ' + state.tone : '');
            feedback.textContent = state.feedback;
          };
          input.value = state.value;
          input.oninput = () => {
            state.value = input.value;
            state.solved = false;
            state.tone = '';
            state.feedback = 'Ответ изменён. Нажми «Проверить».';
            renderFeedback();
            updatePracticeScore();
          };
          card.onsubmit = event => {
            event.preventDefault();
            state.value = input.value;
            state.solved = input.value.trim() === example.answer;
            state.tone = state.solved ? 'good' : 'bad';
            const lastOctet = Number(example.ip.split('.')[3]);
            const explanation = taskIndex === 2
              ? `${bit(lastOctet)} AND 10000000 = ${bit(lastOctet & 128)}. Последний октет сети — ${lastOctet & 128}.`
              : task.hint;
            state.feedback = state.solved
              ? `Верно! ${explanation}`
              : 'Пока неверно. Сравни каждый октет с маской. Можно открыть подсказку и попробовать снова.';
            renderFeedback();
            updatePracticeScore();
          };
          card.querySelector('[type="button"]').onclick = () => {
            state.tone = '';
            state.feedback = task.hint;
            renderFeedback();
          };
          renderFeedback();
          $('taskExamples').append(card);
        });
        updatePracticeScore();
      }

      document.querySelectorAll('[data-task]').forEach(button => {
        button.onclick = () => {
          taskIndex = Number(button.dataset.task);
          drawTask();
        };
      });
      drawTask();
      show((parseInt(location.hash.slice(1))||1)-1);
  };

  /* Lesson 9-5 (9 класс - 5 урок) */
  LESSON_SCRIPTS['9-5'] = function() {
(function(){
  'use strict';
  var IP_POOL=['203.0.113.10','203.0.113.20','203.0.113.30','203.0.113.40','203.0.113.50','203.0.113.60'];
  var RACK=[
    {service:'Сайт олимпиады'},
    {service:'Регистрация участников'},
    {service:'Расписание'},
    {service:'Прямая трансляция'},
    {service:'Материалы для скачивания'},
    {service:'Почта организаторов'}
  ];
  function shuffledCopy(items){
    var copy=items.slice();
    for(var i=copy.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1)),value=copy[i];
      copy[i]=copy[j];copy[j]=value;
    }
    return copy;
  }
  var shuffledIps=shuffledCopy(IP_POOL);
  RACK.forEach(function(server,index){server.ip=shuffledIps[index];});
  var ZONE=[
    {name:'festival.mektep.kz',service:'Сайт олимпиады'},
    {name:'register.festival.mektep.kz',service:'Регистрация участников'},
    {name:'program.festival.mektep.kz',service:'Расписание'},
    {name:'live.festival.mektep.kz',service:'Прямая трансляция'},
    {name:'files.festival.mektep.kz',service:'Материалы для скачивания'},
    {name:'mail.festival.mektep.kz',service:'Почта организаторов'}
  ];
  function serverByService(service){for(var i=0;i<RACK.length;i++){if(RACK[i].service===service)return RACK[i];}return null;}
  ZONE.forEach(function(record){record.ip=serverByService(record.service).ip;});
  var byId=function(id){return document.getElementById(id);};
  function findZone(name){for(var i=0;i<ZONE.length;i++){if(ZONE[i].name===name)return ZONE[i];}return null;}

  var rackEl=byId('dnsRack');
  shuffledCopy(RACK).forEach(function(server){
    var row=document.createElement('div');row.className='dns-rack-item';
    var label=document.createElement('span');label.textContent=server.service;
    var code=document.createElement('code');code.textContent=server.ip;
    row.append(label,code);rackEl.append(row);
  });
  ['copy','cut','contextmenu','selectstart'].forEach(function(eventName){
    rackEl.addEventListener(eventName,function(event){event.preventDefault();});
  });

  var zoneBody=byId('dnsZoneBody');
  ZONE.forEach(function(record){
    var tr=document.createElement('tr');tr.className='zone-row';tr.dataset.name=record.name;
    var nameCell=document.createElement('td');nameCell.textContent=record.name;
    var inputCell=document.createElement('td');
    var input=document.createElement('input');input.type='text';input.className='zone-input';input.autocomplete='off';input.spellcheck=false;
    input.setAttribute('aria-label','IP-адрес для '+record.name);
    inputCell.append(input);
    var statusCell=document.createElement('td');statusCell.className='zone-status';
    tr.append(nameCell,inputCell,statusCell);zoneBody.append(tr);
  });
  function inputFor(name){return zoneBody.querySelector('.zone-row[data-name="'+name+'"] .zone-input');}

  var zoneScore=0;
  function updateScore(){byId('dnsTotal').textContent='За зону: '+zoneScore+' из 6 баллов';}
  function rows(){return zoneBody.querySelectorAll('.zone-row');}
  function eachRow(fn){Array.prototype.forEach.call(rows(),fn);}

  function checkZone(){
    var ok=0;
    eachRow(function(tr){
      var record=findZone(tr.dataset.name),input=tr.querySelector('.zone-input'),status=tr.querySelector('.zone-status');
      tr.classList.remove('correct','wrong');status.classList.remove('ok','no');
      if(input.value.trim()===record.ip){ok++;tr.classList.add('correct');status.textContent='✓';status.classList.add('ok');}
      else{tr.classList.add('wrong');status.textContent='✕';status.classList.add('no');}
    });
    zoneScore=ok;
    var feedback=byId('dnsZoneFeedback');
    if(ok===ZONE.length){feedback.className='result good';feedback.textContent='Все шесть записей ведут на правильные серверы. За зону: 6 из 6 баллов.';}
    else{feedback.className='result bad';feedback.textContent='Верных записей: '+ok+' из '+ZONE.length+'. Сверь сервисы по названию с IP на стойке и исправь ответы.';}
    updateScore();
  }
  function resetZone(){
    eachRow(function(tr){
      var status=tr.querySelector('.zone-status');
      tr.querySelector('.zone-input').value='';
      status.textContent='';status.classList.remove('ok','no');tr.classList.remove('correct','wrong');
    });
    zoneScore=0;
    var feedback=byId('dnsZoneFeedback');feedback.className='result';feedback.textContent='Заполни все шесть записей и проверь зону. Максимум — 6 баллов.';
    updateScore();
  }
  byId('dnsCheck').onclick=checkZone;
  byId('dnsReset').onclick=resetZone;
  var answerKey=byId('dnsAnswerKey');
  if(answerKey){
    var answerList=document.createElement('ul');answerList.className='dns-score-list';
    ZONE.forEach(function(record){
      var item=document.createElement('li'),name=document.createElement('code'),ip=document.createElement('code');
      name.textContent=record.name;ip.textContent=record.ip;
      item.append(name,document.createTextNode(' → '),ip);answerList.append(item);
    });
    answerKey.append(answerList);
  }
  updateScore();
})();

'use strict';
      const $=id=>document.getElementById(id),slides=[...document.querySelectorAll('.slide')];
      let current=0;
      slides.forEach((s,i)=>{
        const b=document.createElement('button');
        b.className='dotbutton';
        b.title=`Слайд ${i+1}: ${s.getAttribute('aria-label')}`;
        b.setAttribute('aria-label', b.title);
        b.dataset.tooltip=b.title;
        b.onclick=()=>show(i);
        $('dots').append(b);
        s.querySelector('[data-next]').onclick=()=>show(i===slides.length-1?0:i+1)
      });
      function show(n){
        current=Math.max(0,Math.min(n,slides.length-1));
        slides.forEach((s,i)=>s.classList.toggle('active',i===current));
        document.querySelectorAll('.dotbutton').forEach((b, i) => {
          if (i === current) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
        slides[current].scrollTop=0;
        $('progress').style.width=((current+1)/slides.length*100)+'%';
        history.replaceState(null,'','#'+(current+1))
      }
      window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1))||1)-1));
      document.addEventListener('keydown',e=>{
        if(e.target.closest('button,input,summary,textarea,select')||e.ctrlKey||e.altKey||e.metaKey)return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          show(current + 1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          show(current - 1);
        }
      });

      
const reviewQuestions = [{"question": "Какая запись является корректным IPv4-адресом?", "options": ["192.168.1.37", "192.168.1.300", "192.168.37", "192.168.one.37"], "answer": "192.168.1.37", "explanation": "IPv4-адрес состоит из четырёх чисел от 0 до 255, разделённых точками."}, {"question": "Что показывает маска подсети?", "options": ["Где в IP-адресе часть сети, а где часть узла", "Скорость подключения к интернету", "Пароль от роутера", "Количество открытых сайтов"], "answer": "Где в IP-адресе часть сети, а где часть узла", "explanation": "Единицы маски отмечают биты сети, нули — биты узла. Маска помогает определить подсеть устройства."}, {"question": "IP: 192.168.5.73. Маска: 255.255.255.0. Каков адрес сети?", "options": ["192.168.5.0", "192.168.0.0", "192.168.5.73", "192.168.5.255"], "answer": "192.168.5.0", "explanation": "Первые три октета сохраняются, последний становится 0: получаем 192.168.5.0."}, {"question": "У всех устройств маска 255.255.0.0. Какой адрес в той же подсети, что и 10.25.17.8?", "options": ["10.25.200.9", "10.26.17.8", "11.25.17.8", "192.168.17.8"], "answer": "10.25.200.9", "explanation": "С маской 255.255.0.0 должны совпасть первые два октета. У обоих устройств адрес сети 10.25.0.0."}, {"question": "IP: 192.168.1.150. Маска: 255.255.255.128. Каков адрес сети?", "options": ["192.168.1.128", "192.168.1.0", "192.168.1.150", "192.168.1.255"], "answer": "192.168.1.128", "explanation": "Последний октет: 150 = 10010110₂. Маска 128 = 10000000₂ сохраняет только первый бит: получаем 128."}];
let reviewIndex=0,reviewScore=0,reviewAnswered=false,reviewFinished=false;
const reviewAnswers=[];
function shuffled(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function finishReview(){
  if(reviewFinished)return;
  reviewFinished=true;$('reviewQuiz').hidden=true;$('reviewSummary').hidden=false;
  $('reviewTotal').textContent=`${reviewScore} из ${reviewQuestions.length}`;
  $('reviewSummaryTitle').textContent=reviewScore>=4?'Ты молодец!':'Повторим прошлый урок';
  $('reviewMessage').textContent=reviewScore>=4?'Все ответы верные — отличная работа! Ты справился с повторением.':'Нужно ещё повторить прошлый урок. Посмотри разбор и попробуй ещё раз.';
  $('reviewAnswerList').replaceChildren();
  reviewQuestions.forEach((q,i)=>{
    const li=document.createElement('li');li.className='review-answer '+(reviewAnswers[i]===q.answer?'is-correct':'is-incorrect');
    const heading=document.createElement('h3');heading.textContent=q.question;li.append(heading);
    [['Твой ответ: ',reviewAnswers[i]],['Правильный ответ: ',q.answer],['Почему: ',q.explanation]].forEach(([label,value])=>{const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label;p.append(strong,document.createTextNode(value));li.append(p);});
    const status=document.createElement('span');status.className='tag';status.textContent=reviewAnswers[i]===q.answer?'✓ Верно':'✕ Разберём ошибку';li.prepend(status);$('reviewAnswerList').append(li);
  });
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i=0;i<28;i++){const piece=document.createElement('i');piece.style.setProperty('--left',`${(i*37)%100}%`);piece.style.setProperty('--delay',`${(i%7)*.08}s`);piece.style.setProperty('--drift',`${(i%2?1:-1)*(20+i*3)}px`);piece.style.background=['#b95132','#ee9b55','#789473','#dfb553'][i%4];$('reviewConfetti').append(piece);}
    setTimeout(()=>$('reviewConfetti').replaceChildren(),2600);
  }
  $('reviewSummaryTitle').focus({preventScroll:true});slides[1].scrollTop=0;
}
function drawReview(){
  if(reviewFinished)return;
  const question=reviewQuestions[reviewIndex];reviewAnswered=false;
  $('reviewCount').textContent=`Вопрос ${reviewIndex+1} из 5 · баллы: ${reviewScore}`;
  $('reviewQuestion').textContent=question.question;$('reviewOptions').replaceChildren();
  $('reviewFeedback').className='result';$('reviewFeedback').textContent='Выбери один из четырёх вариантов. За верный ответ — 1 балл.';$('reviewNext').hidden=true;
  shuffled(question.options).forEach((option,index)=>{
    const button=document.createElement('button');button.className='choice';button.textContent=`${index+1}. ${option}`;button.dataset.option=option;
    button.onclick=()=>{
      if(reviewAnswered||reviewFinished)return;reviewAnswered=true;reviewAnswers.push(option);
      const correct=option===question.answer;if(correct)reviewScore++;
      if(reviewIndex===reviewQuestions.length-1){finishReview();return;}
      [...$('reviewOptions').children].forEach(choice=>{choice.disabled=true;if(choice.dataset.option===question.answer){choice.classList.add('correct');choice.textContent+=' ✓';}});
      if(!correct){button.classList.add('wrong');button.textContent+=' ✕';}
      $('reviewCount').textContent=`Вопрос ${reviewIndex+1} из 5 · баллы: ${reviewScore}`;
      $('reviewFeedback').className='result '+(correct?'good':'bad');$('reviewFeedback').textContent=(correct?'Верно! ':`Правильный ответ: ${question.answer}. `)+question.explanation;
      $('reviewNext').hidden=false;$('reviewNext').focus({preventScroll:true});
    };
    $('reviewOptions').append(button);
  });
}
$('reviewNext').onclick=()=>{if(!reviewAnswered||reviewFinished)return;reviewIndex++;drawReview();$('reviewQuestion').focus({preventScroll:true});};
drawReview();

const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const heroWords=['alasster.site','192.178.25.19'];
let heroWord=0,heroPaused=false,heroTimer=0,heroGeneration=0;
const heroCells=Array.from({length:15},()=>{const cell=document.createElement('span');cell.className='flip-cell';const face=document.createElement('span');face.className='flip-face';cell.append(face);$('heroCode').append(cell);return cell;});
function centeredWord(word){
  const width=15;
  const safe=word.length>width?word.slice(0,width):word;
  const left=' '.repeat(Math.max(0,Math.floor((width-safe.length)/2)));
  return (left+safe).padEnd(width,' ');
}
function paintHero(index){heroWord=index;const word=centeredWord(heroWords[index]);heroCells.forEach((cell,i)=>{cell.className='flip-cell'+(word[i]===' '?' empty':'');cell.firstChild.textContent=word[i];});$('heroVisual').dataset.mode=index?'ip':'name';$('heroKind').textContent=index?'IP-адрес найден':'Имя, которое легко запомнить';$('heroPhaseName').classList.toggle('active',index===0);$('heroPhaseIp').classList.toggle('active',index===1);}
function animateHero(){
  if(heroPaused||document.hidden||!slides[0].classList.contains('active'))return;
  const generation=++heroGeneration,target=1-heroWord,value=centeredWord(heroWords[target]);
  $('heroVisual').classList.add('resolving');$('heroKind').textContent=target?'DNS находит адрес…':'Имя остаётся удобным для человека';
  heroCells.forEach((cell,i)=>{setTimeout(()=>{
    if(generation!==heroGeneration)return;
    cell.classList.add('flipping');
    setTimeout(()=>{if(generation!==heroGeneration)return;cell.firstChild.textContent=value[i];cell.classList.toggle('empty',value[i]===' ');cell.classList.remove('flipping');cell.classList.add('landing');},220);
  },i*45);});
  heroTimer=setTimeout(()=>{if(generation!==heroGeneration)return;paintHero(target);$('heroVisual').classList.remove('resolving');heroTimer=setTimeout(animateHero,3000);},1450);
}
function syncHero(){clearTimeout(heroTimer);heroGeneration++;paintHero(heroWord);$('heroVisual').classList.remove('resolving');if(!heroPaused&&!document.hidden&&slides[0].classList.contains('active'))heroTimer=setTimeout(animateHero,2600);}
$('heroMotion').onclick=()=>{heroPaused=!heroPaused;$('heroMotion').textContent=heroPaused?'▶':'Ⅱ';$('heroMotion').setAttribute('aria-label',heroPaused?'Продолжить анимацию':'Приостановить анимацию');$('heroMotion').setAttribute('aria-pressed',heroPaused);syncHero();};
new MutationObserver(syncHero).observe(slides[0],{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',syncHero);paintHero(0);syncHero();


let domainIndex=0;
function drawDomain(){
 const names=domainIndex===0?['www','google','com']:['ru','wikipedia','org'];
 const labels=[...names,'.'];$('domainParts').replaceChildren();
 labels.forEach((part,i)=>{const level=names.length-i,b=document.createElement('button');b.className='tab';b.setAttribute('aria-pressed','false');b.innerHTML=part+'<small>'+(level===0?'корень':level+'-й уровень')+'</small>';
 b.onclick=()=>{[...$('domainParts').children].forEach(x=>x.setAttribute('aria-pressed',x===b));$('domainInfo').textContent=level===0?'Корень DNS — общая вершина дерева имён. Конечную точку обычно не пишут.':level===1?part+' — домен верхнего, первого уровня.':names.slice(i).join('.')+' — полное имя домена '+level+'-го уровня. '+part+' — его метка.';};$('domainParts').append(b);});
 $('domainInfo').textContent=domainIndex===0?'Читаем справа налево: com — 1-й уровень, google.com — 2-й уровень, а www.google.com — это поддомен 3-го уровня.':'Читаем справа налево: org — 1-й уровень, wikipedia.org — 2-й уровень, а ru.wikipedia.org — 3-й уровень.';
 document.querySelectorAll('[data-domain]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.domain===domainIndex));
}
document.querySelectorAll('[data-domain]').forEach(b=>b.onclick=()=>{domainIndex=+b.dataset.domain;drawDomain();});drawDomain();
const domainTypeContent=[
 '<h3>По странам и территориям</h3><p><code>.kz</code> — Казахстан · <code>.ru</code> — Россия · <code>.uk</code> — Великобритания.</p><h3>По назначению</h3><p><code>.com</code> — изначально коммерция;<br><code>.org</code> — организации;<br><code>.net</code> — изначально сетевые службы.</p><p class="small">Сегодня com, org и net используются шире первоначального назначения.</p><h3>Специальные</h3><p><code>.edu</code> — прежде всего вузы США*;<br><code>.gov</code> — госорганизации США;<br><code>.mil</code> — военные структуры США.</p><p class="small">*Новые регистрации .edu — для аккредитованных учреждений послешкольного образования США. У других стран — свои системы доменов.</p>',
 '<h3>Имя внутри верхнего уровня</h3><p>Домен второго уровня состоит из выбранной метки и домена верхнего уровня. Поддомен www добавляется слева и образует 3-й уровень.</p><div class="domain-example"><strong>www<span>.google.com</span></strong><small>www — 3-й уровень, Google внутри 2-го уровня</small></div><div class="domain-example"><strong>youtube<span>.com</span></strong><small>YouTube</small></div><div class="domain-example"><strong>wikipedia<span>.org</span></strong><small>Википедия</small></div><div class="domain-example"><strong>kaspi<span>.kz</span></strong><small>Kaspi</small></div><p class="small below">www — это поддомен, а не отдельный домен верхнего уровня: www.google.com — название 3-го уровня внутри google.com.</p>'
];
function drawDomainType(i){$('domainTypes').innerHTML=domainTypeContent[i];document.querySelectorAll('[data-domain-type]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.domainType===i));}
document.querySelectorAll('[data-domain-type]').forEach(b=>b.onclick=()=>drawDomainType(+b.dataset.domainType));drawDomainType(0);

const missions=[
 {brand:'YOUTUBE',title:'1. YouTube',kind:'video',prompt:'Собери правильный адрес видеосервиса',pool:['https://','www','youtube','.com','/'],answer:['https://','www','youtube','.com','/'],why:'https://www.youtube.com/ — корректный адрес видеосервиса.'},
 {brand:'ВИКИПЕДИЯ',title:'2. Википедия',kind:'wiki',prompt:'Собери адрес русскоязычной Википедии',pool:['https://','ru','wikipedia','.org','/wiki'],answer:['https://','ru','wikipedia','.org','/wiki'],why:'https://ru.wikipedia.org/wiki — полный адрес русскоязычной статьи и раздела сайта.'},
 {brand:'GOOGLE MAPS',title:'3. Карты Google',kind:'maps',prompt:'Собери адрес карт Google',pool:['https://','www','google','.com','/maps'],answer:['https://','www','google','.com','/maps'],why:'https://www.google.com/maps — корректный адрес сервиса с картами.'},
 {brand:'KASPI',title:'4. Kaspi',kind:'kaspi',prompt:'Собери адрес сервиса Kaspi',pool:['https://','kaspi','.kz','/'],answer:['https://','kaspi','.kz','/'],why:'https://kaspi.kz/ — корректный адрес сервиса.'},
 {brand:'GOOGLE SUPPORT',title:'5. Справка Google',kind:'google',prompt:'Собери адрес справки Google',pool:['https://','support','google','.com','/'],answer:['https://','support','google','.com','/'],why:'https://support.google.com/ — адрес справки Google.'}
];
let missionIndex=0;
const buildStates=missions.map(()=>({selected:[],solved:false,feedback:'Выбери все карточки в нужном порядке. Точки появятся автоматически.',tone:''}));
function sameSelection(selected, expected){return JSON.stringify(selected)===JSON.stringify(expected);}
function checkBuild(){const m=missions[missionIndex],s=buildStates[missionIndex];s.solved=sameSelection(s.selected,m.answer);s.tone=s.solved?'good':'bad';s.feedback=s.solved?'✓ Верно! '+s.selected.join(' · ')+' — это полный URL. '+m.why:s.selected.length<m.answer.length?'Добавь оставшиеся карточки.':'Порядок пока неверный. Слева должен быть протокол, затем www, а после него — домен. Переставь карточки или нажми на лишнюю, чтобы вернуть её.';drawBuild();}
function changedBuild(){const s=buildStates[missionIndex];s.solved=false;s.tone='';s.feedback='Нажми «Проверить» или добавь остальные части.';if(s.selected.length===missions[missionIndex].answer.length)checkBuild();else drawBuild();}
function moveBuild(from,to){const s=buildStates[missionIndex];if(from<0||from>=s.selected.length||to<0||to>=s.selected.length)return;s.selected.splice(to,0,s.selected.splice(from,1)[0]);changedBuild();$('buildSequence').querySelectorAll('button')[to]?.focus();}
function drawBuild(){
 const m=missions[missionIndex],s=buildStates[missionIndex];$('buildTitle').textContent=m.title;$('buildBrand').textContent=m.brand;$('buildBrand').dataset.brand=m.kind;$('buildPrompt').textContent=m.prompt;
 $('buildPool').replaceChildren();$('buildSequence').replaceChildren();$('buildMissions').replaceChildren();
 const poolOrder=shuffled([...m.pool]);
 function allowDrop(el,to){el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();e.stopPropagation();try{const d=JSON.parse(e.dataTransfer.getData('text/plain'));if(d.mission!==missionIndex)return;if(d.from!==undefined)moveBuild(d.from,Math.min(to,s.selected.length-1));else if(m.pool.includes(d.word)&&!s.selected.includes(d.word)){s.selected.splice(to,0,d.word);changedBuild();}}catch(_){}};}
 poolOrder.forEach(word=>{const b=document.createElement('button');b.className='choice';b.textContent=word;b.disabled=s.selected.includes(word);b.draggable=!b.disabled;b.onclick=()=>{s.selected.push(word);changedBuild();};b.ondragstart=e=>e.dataTransfer.setData('text/plain',JSON.stringify({word,mission:missionIndex}));$('buildPool').append(b);});
 s.selected.forEach((word,i)=>{if(i){const dot=document.createElement('span');dot.className='join-dot';dot.textContent=word.includes('/')||word.includes('://')?'/':'.';dot.setAttribute('aria-hidden','true');$('buildSequence').append(dot);}const b=document.createElement('button');b.className='tab';b.textContent=word;b.draggable=true;b.setAttribute('aria-label',word+'. Нажми, чтобы убрать; стрелки влево и вправо меняют порядок.');b.onclick=()=>{s.selected.splice(i,1);changedBuild();};b.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveBuild(i,i+(e.key==='ArrowLeft'?-1:1));}};b.ondragstart=e=>e.dataTransfer.setData('text/plain',JSON.stringify({from:i,mission:missionIndex}));allowDrop(b,i);$('buildSequence').append(b);});allowDrop($('buildSequence'),s.selected.length);
 missions.forEach((m,i)=>{const b=document.createElement('button');b.className='tab'+(buildStates[i].solved?' solved':'');b.textContent=m.title;b.setAttribute('aria-pressed',i===missionIndex);b.onclick=()=>{missionIndex=i;drawBuild();};$('buildMissions').append(b);});
 $('buildFeedback').className='result '+s.tone;$('buildFeedback').textContent=s.feedback;$('buildScore').textContent=`Собрано: ${buildStates.filter(s=>s.solved).length} из 5`;
}
$('checkBuild').onclick=checkBuild;$('resetBuild').onclick=()=>{buildStates[missionIndex].selected=[];changedBuild();};$('hintBuild').onclick=()=>{const m=missions[missionIndex],s=buildStates[missionIndex];s.feedback='Начни с https://, затем www, потом имя домена и домен верхнего уровня.';s.tone='';drawBuild();};drawBuild();

const protocols=[
 ['DNS','Найти адрес по имени','DNS запрашивает и возвращает записи об именах. В нашем примере A-запись связывает имя с IPv4-адресом.'],
 ['HTTPS','Защитить веб-обмен','HTTPS — HTTP с защитой TLS: шифрование и проверка подлинности сервера по сертификату.'],
 ['TCP','Надёжно и по порядку','TCP обеспечивает надёжную доставку потока байтов в правильном порядке; при потере данных организует повторную передачу.'],
 ['IP','Адресовать пакеты','IP обеспечивает адресацию и передачу пакетов между сетями. Сам по себе он не гарантирует доставку.'],
 ['FTP','Обмениваться файлами','FTP предназначен для передачи файлов между клиентом и сервером. Обычный FTP не шифрует данные и пароль.']
];
protocols.forEach((p,i)=>{const b=document.createElement('button');b.className='tab';b.innerHTML=p[0]+'<small>'+p[1]+'</small>';b.setAttribute('aria-pressed',i===0);b.onclick=()=>{[...$('protocolCards').children].forEach(x=>x.setAttribute('aria-pressed',x===b));$('protocolInfo').textContent=p[2];};$('protocolCards').append(b);});$('protocolInfo').textContent=protocols[0][2];
const protocolQuiz=[
 ['Нужно узнать IP-адрес по имени portal.example.org.','DNS','Поиск записи об имени — работа DNS.'],
 ['Нужно защитить отправку пароля между браузером и сайтом.','HTTPS','HTTPS защищает веб-обмен с помощью TLS.'],
 ['Нужна надёжная доставка потока данных в исходном порядке.','TCP','TCP проверяет доставку и восстанавливает порядок данных.'],
 ['Какой протокол задаёт IP-адреса отправителя и получателя пакета?','IP','Адресация пакетов — задача IP.'],
 ['Клиент работает с файловым сервером по File Transfer Protocol.','FTP','FTP — протокол передачи файлов. Обычный FTP не защищает их шифрованием.']
];
let protocolIndex=0,protocolScore=0,protocolAnswered=false;
function drawProtocolQuiz(){
 protocolAnswered=false;const q=protocolQuiz[protocolIndex];$('protocolQuestion').textContent=q[0];$('protocolCount').textContent=`Ситуация ${protocolIndex+1} из ${protocolQuiz.length} · верно: ${protocolScore}`;$('protocolOptions').replaceChildren();$('protocolFeedback').className='result';$('protocolFeedback').textContent='Выбери протокол по его задаче.';$('protocolNext').hidden=true;
 shuffled(protocols.map(p=>p[0])).forEach(p=>{const b=document.createElement('button');b.className='choice';b.textContent=p;b.onclick=()=>{if(protocolAnswered)return;protocolAnswered=true;const ok=p===q[1];if(ok)protocolScore++;[...$('protocolOptions').children].forEach(x=>{x.disabled=true;if(x.textContent===q[1]){x.classList.add('correct');x.textContent+=' ✓';}});if(!ok){b.classList.add('wrong');b.textContent+=' ✕';}$('protocolFeedback').className='result '+(ok?'good':'bad');$('protocolFeedback').textContent=(ok?'Верно! ':'Верный ответ: '+q[1]+'. ')+q[2];$('protocolCount').textContent=`Ситуация ${protocolIndex+1} из ${protocolQuiz.length} · верно: ${protocolScore}`;$('protocolNext').hidden=false;$('protocolNext').textContent=protocolIndex===protocolQuiz.length-1?'Повторить ситуации':'Следующая ситуация';$('protocolNext').focus({preventScroll:true});};$('protocolOptions').append(b);});
}
$('protocolNext').onclick=()=>{if(!protocolAnswered)return;if(protocolIndex===protocolQuiz.length-1){protocolIndex=0;protocolScore=0;}else protocolIndex++;drawProtocolQuiz();$('protocolQuestion').focus({preventScroll:true});};drawProtocolQuiz();

show((parseInt(location.hash.slice(1))||1)-1);
  };

  /* Lesson 9-6 (9 класс - 6 урок) */
  LESSON_SCRIPTS['9-6'] = function() {
'use strict';
    const $ = id => document.getElementById(id);
    const slides = [...document.querySelectorAll('.slide')];
    let current = 0;

    // Инициализация точек навигации (6 слайдов)
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'dotbutton';
      b.title = `Слайд ${i + 1}: ${s.getAttribute('aria-label')}`;
      b.setAttribute('aria-label', b.title);
      b.dataset.tooltip = b.title;
      b.onclick = () => show(i);
      $('dots').append(b);
      const nextBtn = s.querySelector('[data-next]');
      if (nextBtn) {
        nextBtn.onclick = () => show(i === slides.length - 1 ? 0 : i + 1);
      }
    });

    function show(n) {
      current = Math.max(0, Math.min(n, slides.length - 1));
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      document.querySelectorAll('.dotbutton').forEach((b, i) => {
        if (i === current) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      slides[current].scrollTop = 0;
      $('progress').style.width = ((current + 1) / slides.length * 100) + '%';
      history.replaceState(null, '', '#' + (current + 1));
    }

    window.addEventListener('hashchange', () => show((parseInt(location.hash.slice(1)) || 1) - 1));
    document.addEventListener('keydown', e => {
      if (e.target.closest('button, input, summary, textarea, select') || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        show(current + 1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        show(current - 1);
      }
    });

    // -------------------------------------------------------------
    // СЛАЙД 2: КВИЗ ПОВТОРЕНИЯ
    // -------------------------------------------------------------
    const reviewQuestions = [
      {
        question: "Какова основная задача доменной системы имён (DNS)?",
        options: [
          "Преобразовывать текстовые имена сайтов в числовые IP-адреса",
          "Увеличивать физическую скорость кабеля интернета",
          "Хранить все пароли пользователей от аккаунтов",
          "Защищать компьютер от вирусов и вредоносных программ"
        ],
        answer: "Преобразовывать текстовые имена сайтов в числовые IP-адреса",
        explanation: "DNS работает как телефонная книга: сопоставляет удобное имя (например, google.com) с его IP-адресом."
      },
      {
        question: "Чем протокол HTTPS отличается от обычного HTTP?",
        options: [
          "HTTPS шифрует передаваемые данные с помощью TLS/SSL",
          "HTTPS работает только на смартфонах",
          "HTTPS не требует подключения к интернету",
          "HTTPS передаёт только графические файлы и видео"
        ],
        answer: "HTTPS шифрует передаваемые данные с помощью TLS/SSL",
        explanation: "Буква 'S' означает Secure: данные между браузером и сайтом передаются в зашифрованном виде, защищая личные данные."
      },
      {
        question: "Какой транспортный протокол гарантирует доставку пакетов без потерь и в строгом порядке?",
        options: [
          "TCP",
          "IP",
          "DNS",
          "UDP"
        ],
        answer: "TCP",
        explanation: "Протокол TCP устанавливает надёжное соединение, проверяет контрольные суммы и при потере запрашивает пакеты повторно."
      },
      {
        question: "У компьютера IP-адрес 192.168.10.45 и маска 255.255.255.0. Каков адрес сети?",
        options: [
          "192.168.10.0",
          "192.168.0.0",
          "192.168.10.45",
          "192.168.10.255"
        ],
        answer: "192.168.10.0",
        explanation: "Маска 255.255.255.0 сохраняет первые три октета без изменений, а октет узла обнуляется: 192.168.10.0."
      },
      {
        question: "В адресе сайта «school.bilim.kz» домен какого уровня представляет элемент «.kz»?",
        options: [
          "1-го уровня (верхний уровень)",
          "2-го уровня",
          "3-го уровня",
          "Корневой уровень"
        ],
        answer: "1-го уровня (верхний уровень)",
        explanation: "Доменное имя читается справа налево: .kz — домен 1-го (верхнего) национального уровня Казахстана."
      }
    ];

    let reviewIndex = 0, reviewScore = 0, reviewAnswered = false, reviewFinished = false;
    const reviewAnswers = [];

    function shuffled(values) {
      const res = [...values];
      for (let i = res.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
      }
      return res;
    }

    function finishReview() {
      if (reviewFinished) return;
      reviewFinished = true;
      $('reviewQuiz').hidden = true;
      $('reviewSummary').hidden = false;
      $('reviewTotal').textContent = `${reviewScore} из ${reviewQuestions.length}`;
      $('reviewSummaryTitle').textContent = reviewScore >= 4 ? 'Отличный результат!' : 'Повторение пройдено';
      $('reviewMessage').textContent = reviewScore >= 4
        ? 'Ты отлично помнишь темы прошлых уроков! Теперь переходим к пропускной способности сети.'
        : 'Хорошая разминка! Обязательно загляни в разбор ответов ниже.';

      $('reviewAnswerList').replaceChildren();
      reviewQuestions.forEach((q, i) => {
        const li = document.createElement('li');
        const isOk = reviewAnswers[i] === q.answer;
        li.className = 'review-answer ' + (isOk ? 'is-correct' : 'is-incorrect');
        const heading = document.createElement('h3');
        heading.textContent = q.question;
        li.append(heading);

        [
          ['Твой ответ: ', reviewAnswers[i] || '—'],
          ['Правильный ответ: ', q.answer],
          ['Пояснение: ', q.explanation]
        ].forEach(([lbl, val]) => {
          const p = document.createElement('p'), s = document.createElement('strong');
          s.textContent = lbl;
          p.append(s, document.createTextNode(val));
          li.append(p);
        });

        const st = document.createElement('span');
        st.className = 'tag';
        st.textContent = isOk ? '✓ Верно' : '✕ Ошибка';
        li.prepend(st);
        $('reviewAnswerList').append(li);
      });

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 28; i++) {
          const piece = document.createElement('i');
          piece.style.setProperty('--left', `${(i * 37) % 100}%`);
          piece.style.setProperty('--delay', `${(i % 7) * .08}s`);
          piece.style.setProperty('--drift', `${(i % 2 ? 1 : -1) * (20 + i * 3)}px`);
          piece.style.background = ['#b95132', '#ee9b55', '#789473', '#dfb553'][i % 4];
          $('reviewConfetti').append(piece);
        }
        setTimeout(() => $('reviewConfetti').replaceChildren(), 2600);
      }
      $('reviewSummaryTitle').focus({ preventScroll: true });
    }

    function drawReview() {
      if (reviewFinished) return;
      const question = reviewQuestions[reviewIndex];
      reviewAnswered = false;
      $('reviewCount').textContent = `Вопрос ${reviewIndex + 1} из 5 · баллы: ${reviewScore}`;
      $('reviewQuestion').textContent = question.question;
      $('reviewOptions').replaceChildren();
      $('reviewFeedback').className = 'result';
      $('reviewFeedback').textContent = 'Выбери один из четырёх вариантов. За верный ответ — 1 балл.';
      $('reviewNext').hidden = true;

      shuffled(question.options).forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = `${idx + 1}. ${opt}`;
        btn.dataset.option = opt;
        btn.onclick = () => {
          if (reviewAnswered || reviewFinished) return;
          reviewAnswered = true;
          reviewAnswers.push(opt);
          const correct = opt === question.answer;
          if (correct) reviewScore++;

          [...$('reviewOptions').children].forEach(c => {
            c.disabled = true;
            if (c.dataset.option === question.answer) {
              c.classList.add('correct');
              c.textContent += ' ✓';
            }
          });
          if (!correct) {
            btn.classList.add('wrong');
            btn.textContent += ' ✕';
          }

          $('reviewCount').textContent = `Вопрос ${reviewIndex + 1} из 5 · баллы: ${reviewScore}`;
          $('reviewFeedback').className = 'result ' + (correct ? 'good' : 'bad');
          $('reviewFeedback').textContent = (correct ? 'Верно! ' : `Правильный ответ: ${question.answer}. `) + question.explanation;

          if (reviewIndex === reviewQuestions.length - 1) {
            $('reviewNext').hidden = false;
            $('reviewNext').textContent = 'Посмотреть результаты';
          } else {
            $('reviewNext').hidden = false;
            $('reviewNext').textContent = 'Следующий вопрос';
          }
          $('reviewNext').focus({ preventScroll: true });
        };
        $('reviewOptions').append(btn);
      });
    }

    $('reviewNext').onclick = () => {
      if (!reviewAnswered || reviewFinished) return;
      if (reviewIndex === reviewQuestions.length - 1) {
        finishReview();
      } else {
        reviewIndex++;
        drawReview();
        $('reviewQuestion').focus({ preventScroll: true });
      }
    };
    drawReview();

    // -------------------------------------------------------------
    // СЛАЙД 3: СВЕТЛЫЙ SPEEDTEST (БЕЗ 100 МБИТ ЛИМИТА)
    // -------------------------------------------------------------

    // ТОЧНЫЙ ЗАМЕР СКОРОСТИ СЕТИ С ПЛАВНОЙ АНИМАЦИЕЙ (60 FPS)
    let stTesting = false;
    let stCurAngle = -90;
    let stTargetAngle = -90;
    let stCurDispSpeed = 0;
    let stTargetDispSpeed = 0;
    let stRafId = null;

    function updateSpeedGaugeAnim() {
      // Плавная интерполяция стрелки и цифр без рывков
      stCurAngle += (stTargetAngle - stCurAngle) * 0.1;
      stCurDispSpeed += (stTargetDispSpeed - stCurDispSpeed) * 0.1;

      $('stNeedle').style.transform = `translateX(-50%) rotate(${stCurAngle.toFixed(2)}deg)`;
      $('stSpeedNum').textContent = stCurDispSpeed < 0.2 ? '0.0' : stCurDispSpeed.toFixed(1);

      if (stTesting || Math.abs(stCurAngle - stTargetAngle) > 0.1 || Math.abs(stCurDispSpeed - stTargetDispSpeed) > 0.1) {
        stRafId = requestAnimationFrame(updateSpeedGaugeAnim);
      } else {
        stRafId = null;
      }
    }

    function setGaugeSpeed(speedMbps) {
      stTargetDispSpeed = Math.max(0, speedMbps);
      // Шкала 0 -> -90deg, 500+ -> +90deg
      const pct = Math.min(1, stTargetDispSpeed / 500);
      stTargetAngle = -90 + pct * 180;
      if (!stRafId) {
        stRafId = requestAnimationFrame(updateSpeedGaugeAnim);
      }
    }

    $('stGoBtn').onclick = async () => {
      if (stTesting) return;
      stTesting = true;
      $('stGoBtn').disabled = true;
      $('stPingVal').textContent = '...';
      $('stDownVal').textContent = '...';
      $('stUpVal').textContent = '...';
      setGaugeSpeed(0);

      try {
        // ЭТАП 1: PING (4 быстрых замера до ближайшего PoP)
        $('stPhaseLabel').textContent = '1/3 · ЗАМЕР ЗАДЕРЖКИ (PING)...';
        const pings = [];
        for (let i = 0; i < 4; i++) {
          const t0 = performance.now();
          await fetch(`https://speed.cloudflare.com/__down?bytes=0&_nocache=${Date.now()}_${i}`, { cache: 'no-store' });
          const t1 = performance.now();
          pings.push(t1 - t0);
          await new Promise(r => setTimeout(r, 50));
        }
        const realPing = Math.max(1, Math.round(Math.min(...pings)));
        $('stPingVal').textContent = realPing + ' ms';

        // ЭТАП 2: DOWNLOAD (непрерывный тест 5 секунд для точной оценки полосы)
        const DOWN_DURATION = 5000; // 5 секунд
        const WARMUP_MS = 1000;     // отсекаем первые 1000 мс всплеска буфера
        let totalDownBytes = 0;
        let steadyDownBytes = 0;
        let steadyDownStart = 0;
        const downStart = performance.now();
        let chunkIndex = 0;

        $('stPhaseLabel').textContent = '2/3 · СКАЧИВАНИЕ (5 сек)...';

        while ((performance.now() - downStart) < DOWN_DURATION) {
          chunkIndex++;
          const res = await fetch(`https://speed.cloudflare.com/__down?bytes=25000000&_nocache=${Date.now()}_${chunkIndex}`, { cache: 'no-store' });
          if (!res.ok) break;
          const reader = res.body.getReader();

          let streamDone = false;
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            const now = performance.now();
            const elapsed = now - downStart;
            totalDownBytes += value.length;

            if (elapsed >= WARMUP_MS) {
              if (steadyDownStart === 0) {
                steadyDownStart = now;
                steadyDownBytes = value.length;
              } else {
                steadyDownBytes += value.length;
              }

              const steadySec = (now - steadyDownStart) / 1000;
              if (steadySec > 0.25) {
                const liveMbps = (steadyDownBytes * 8) / (steadySec * 1000000);
                setGaugeSpeed(liveMbps);
              }
            } else {
              const warmSec = elapsed / 1000;
              if (warmSec > 0.15) {
                setGaugeSpeed((totalDownBytes * 8) / (warmSec * 1000000));
              }
            }

            const secLeft = Math.max(1, Math.ceil((DOWN_DURATION - elapsed) / 1000));
            $('stPhaseLabel').textContent = `2/3 · СКАЧИВАНИЕ · ${secLeft} сек...`;

            if (elapsed >= DOWN_DURATION) {
              try { await reader.cancel(); } catch (e) {}
              streamDone = true;
              break;
            }
          }
        }

        const steadySec = steadyDownStart > 0 ? (performance.now() - steadyDownStart) / 1000 : (DOWN_DURATION / 1000);
        const finalDownMbps = steadyDownBytes > 0 && steadySec > 0
          ? ((steadyDownBytes * 8) / (steadySec * 1000000)).toFixed(1)
          : ((totalDownBytes * 8) / ((performance.now() - downStart) / 1000 * 1000000)).toFixed(1);

        $('stDownVal').textContent = finalDownMbps + ' Mbps';
        setGaugeSpeed(parseFloat(finalDownMbps));
        await new Promise(r => setTimeout(r, 600));

        // ЭТАП 3: UPLOAD (непрерывная отдача 4 секунды)
        const UP_DURATION = 4000; // 4 секунды
        const UP_WARMUP_MS = 800;
        const upStart = performance.now();
        let upTotalBytes = 0;
        let upSteadyBytes = 0;
        let upSteadyStart = 0;
        let upIter = 0;

        const upPayload = new Uint8Array(2000000);
        for (let i = 0; i < 20000; i++) upPayload[i] = (i * 137) & 255;

        $('stPhaseLabel').textContent = '3/3 · ОТДАЧА (4 сек)...';

        while ((performance.now() - upStart) < UP_DURATION) {
          upIter++;
          const postRes = await fetch(`https://speed.cloudflare.com/__up?_nocache=${Date.now()}_${upIter}`, {
            method: 'POST',
            body: upPayload,
            headers: { 'Content-Type': 'application/octet-stream' },
            cache: 'no-store'
          });
          if (!postRes.ok) break;

          const now = performance.now();
          const elapsed = now - upStart;
          upTotalBytes += upPayload.length;

          if (elapsed >= UP_WARMUP_MS) {
            if (upSteadyStart === 0) {
              upSteadyStart = now;
              upSteadyBytes = upPayload.length;
            } else {
              upSteadyBytes += upPayload.length;
            }

            const steadySec = (now - upSteadyStart) / 1000;
            if (steadySec > 0.2) {
              const liveUp = (upSteadyBytes * 8) / (steadySec * 1000000);
              setGaugeSpeed(liveUp);
            }
          } else {
            const warmSec = elapsed / 1000;
            if (warmSec > 0.15) {
              setGaugeSpeed((upTotalBytes * 8) / (warmSec * 1000000));
            }
          }

          const secLeft = Math.max(1, Math.ceil((UP_DURATION - elapsed) / 1000));
          $('stPhaseLabel').textContent = `3/3 · ОТДАЧА · ${secLeft} сек...`;
        }

        const upSteadySec = upSteadyStart > 0 ? (performance.now() - upSteadyStart) / 1000 : (UP_DURATION / 1000);
        const finalUpMbps = upSteadyBytes > 0 && upSteadySec > 0
          ? ((upSteadyBytes * 8) / (upSteadySec * 1000000)).toFixed(1)
          : ((upTotalBytes * 8) / ((performance.now() - upStart) / 1000 * 1000000)).toFixed(1);

        $('stUpVal').textContent = finalUpMbps + ' Mbps';
        setGaugeSpeed(parseFloat(finalUpMbps));

        $('stPhaseLabel').textContent = 'ЗАМЕР ЗАВЕРШЁН ✓';
        await new Promise(r => setTimeout(r, 2200));
        setGaugeSpeed(0);

      } catch (err) {
        console.error('Ошибка прямого замера скорости:', err);
        $('stPhaseLabel').textContent = 'ОШИБКА ПОДКЛЮЧЕНИЯ К СЕРВЕРУ';
        $('stDownVal').textContent = '—';
        $('stUpVal').textContent = '—';
        alert('Не удалось выполнить прямой замер (сервер не ответил или заблокирован сетью). Воспользуйся ссылкой на Speedtest.net ниже.');
      } finally {
        $('stGoBtn').disabled = false;
        stTesting = false;
      }
    };

    // -------------------------------------------------------------
    // СЛАЙД 4: ФОРМУЛА Q = v × t И СИМУЛЯТОР
    // -------------------------------------------------------------
    let simTimer = null;
    let simRunning = false;

    function getSimParams() {
      const fileSizeMB = parseFloat($('simFileSize').value);
      const netSpeedMbps = parseFloat($('simNetSpeed').value);
      const byteRateMBs = netSpeedMbps / 8;
      const totalSeconds = fileSizeMB / byteRateMBs;
      return { fileSizeMB, netSpeedMbps, byteRateMBs, totalSeconds };
    }

    function updateSimBreakdown() {
      const { fileSizeMB, netSpeedMbps, byteRateMBs, totalSeconds } = getSimParams();
      const fileSizeMbit = fileSizeMB * 8;
      $('simFormulaBreakdown').innerHTML = `
        <strong>Расчёт по формуле:</strong><br>
        1. Переводим размер файла в мегабиты: Q = ${fileSizeMB} МБ × 8 = <strong>${fileSizeMbit} Мбит</strong>.<br>
        2. Скорость канала: v = <strong>${netSpeedMbps} Мбит/с</strong> (или ${byteRateMBs} МБ/с).<br>
        3. Время передачи: t = Q ÷ v = ${fileSizeMbit} ÷ ${netSpeedMbps} = <strong>${totalSeconds.toFixed(1)} сек</strong>.
      `;
      $('simLoadedText').textContent = `Передано: 0 МБ из Q = ${fileSizeMB} МБ`;
      $('simTimeText').textContent = `Осталось: ${totalSeconds.toFixed(1)} с`;
      $('simProgressBar').style.width = '0%';
    }

    $('simFileSize').onchange = updateSimBreakdown;
    $('simNetSpeed').onchange = updateSimBreakdown;
    updateSimBreakdown();

    $('simStartBtn').onclick = () => {
      if (simRunning) return;
      simRunning = true;
      $('simStartBtn').disabled = true;
      $('simFileSize').disabled = true;
      $('simNetSpeed').disabled = true;

      const { fileSizeMB, totalSeconds } = getSimParams();
      const displayDurationMs = Math.min(6000, Math.max(1500, totalSeconds * 400));
      const startTime = performance.now();

      clearInterval(simTimer);
      simTimer = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const fraction = Math.min(1, elapsed / displayDurationMs);
        const currentMB = (fraction * fileSizeMB).toFixed(1);
        const remainSec = Math.max(0, (1 - fraction) * totalSeconds).toFixed(1);

        $('simProgressBar').style.width = (fraction * 100) + '%';
        $('simLoadedText').textContent = `Передано: ${currentMB} МБ из Q = ${fileSizeMB} МБ`;
        $('simTimeText').textContent = fraction >= 1 ? 'Завершено! ✓' : `Осталось: ${remainSec} с`;

        if (fraction >= 1) {
          clearInterval(simTimer);
          simRunning = false;
          $('simStartBtn').disabled = false;
          $('simFileSize').disabled = false;
          $('simNetSpeed').disabled = false;
        }
      }, 50);
    };

    $('simResetBtn').onclick = () => {
      clearInterval(simTimer);
      simRunning = false;
      $('simStartBtn').disabled = false;
      $('simFileSize').disabled = false;
      $('simNetSpeed').disabled = false;
      updateSimBreakdown();
    };

    // -------------------------------------------------------------
    // СЛАЙД 5: ДИНАМИЧЕСКИЕ ЧИСЛА (ВСЕГДА ЦЕЛЫЕ ОТВЕТЫ, БЕЗ ПОДСКАЗОК)
    // -------------------------------------------------------------
    let currLabAnswers = [];
    let currTrainerAnswers = [];
    let scoreBlock1 = 0;
    let scoreBlock2 = 0;

    function randChoice(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateTasks() {
      // БЛОК 1:
      // 1.1: v (Мбит/с) -> скорость в МБайт/с (делим на 8)
      const k1 = randChoice([15, 20, 25, 30, 40, 50, 60, 75, 100]);
      const v1 = k1 * 8; // например, 160, 240, 320, 400, 600...
      const ans1_1 = k1; // ответ в МБайт/с
      $('labText0').innerHTML = `<strong>1.1. Перевод скорости:</strong> Тариф интернета равен <strong>${v1} Мбит/с</strong>. Какова теоретическая скорость загрузки в <strong>МБайт/с</strong>?`;

      // 1.2: t = (Q * 8) / v
      const t1_2 = randChoice([10, 15, 20, 25, 30]);
      const k1_2 = randChoice([2, 3, 4, 5]);
      const v1_2 = k1_2 * 8; // 16, 24, 32, 40
      const Q1_2 = k1_2 * t1_2; // МБайт
      const ans1_2 = t1_2;
      $('labText1').innerHTML = `<strong>1.2. Время отправки:</strong> Презентация весит <strong>${Q1_2} МБайт</strong>. Скорость отдачи равна <strong>${v1_2} Мбит/с</strong>. За сколько <strong>секунд</strong> передастся файл?`;

      // 1.3: v = (Q * 8) / t
      const k1_3 = randChoice([3, 4, 5, 6, 8, 10]);
      const v1_3 = k1_3 * 8; // 24, 32, 40, 48, 64, 80
      const t1_3 = randChoice([5, 8, 10, 12, 15, 20]);
      const Q1_3 = k1_3 * t1_3;
      const ans1_3 = v1_3;
      $('labText2').innerHTML = `<strong>1.3. Определение скорости:</strong> За <strong>${t1_3} секунд</strong> был передан файл размером <strong>${Q1_3} МБайт</strong>. Какова скорость канала в <strong>Мбит/с</strong>?`;

      // 1.4: КБайт -> Кбит
      const qKB = randChoice([4, 6, 8, 12, 15, 20, 25, 30]);
      const ans1_4 = qKB * 8;
      $('labText3').innerHTML = `<strong>1.4. Перевод единиц:</strong> Переведи объём <strong>${qKB} КБайт</strong> в <strong>Кбиты</strong>.`;

      currLabAnswers = [String(ans1_1), String(ans1_2), String(ans1_3), String(ans1_4)];

      // БЛОК 2 (Задачи связиста с переводом между единицами: КБайт, МБайт, Кбит/с, Мбит/с):
      // 2.1: Время t (в секундах) — перевод из МБайт в Кбит (Q в МБайтах, v в Кбит/с)
      const opts2_1 = [
        { Q: 1, v: 256, t: 32 },
        { Q: 2, v: 256, t: 64 },
        { Q: 2, v: 512, t: 32 },
        { Q: 3, v: 512, t: 48 },
        { Q: 4, v: 512, t: 64 },
        { Q: 3, v: 1024, t: 24 },
        { Q: 5, v: 1024, t: 40 },
        { Q: 6, v: 1024, t: 48 },
        { Q: 8, v: 1024, t: 64 },
        { Q: 5, v: 2048, t: 20 },
        { Q: 6, v: 2048, t: 24 },
        { Q: 8, v: 2048, t: 32 },
        { Q: 10, v: 2048, t: 40 }
      ];
      const item2_1 = randChoice(opts2_1);
      const ans2_1 = item2_1.t;
      $('trainText1').innerHTML = `Файл размером <strong>${item2_1.Q} МБайт</strong> передаётся по линии связи со скоростью <strong>${item2_1.v} Кбит/с</strong> (считай 1 МБайт = 1024 КБайт). За сколько <strong>секунд</strong> передастся файл?`;

      // 2.2: Объём данных Q (в МБайтах) — перевод скорости из Кбит/с в МБайт за t секунд
      const opts2_2 = [
        { v: 512, t: 32, Q: 2 },
        { v: 512, t: 48, Q: 3 },
        { v: 512, t: 64, Q: 4 },
        { v: 1024, t: 16, Q: 2 },
        { v: 1024, t: 24, Q: 3 },
        { v: 1024, t: 32, Q: 4 },
        { v: 1024, t: 48, Q: 6 },
        { v: 1024, t: 64, Q: 8 },
        { v: 2048, t: 12, Q: 3 },
        { v: 2048, t: 16, Q: 4 },
        { v: 2048, t: 20, Q: 5 },
        { v: 2048, t: 24, Q: 6 },
        { v: 2048, t: 32, Q: 8 },
        { v: 4096, t: 10, Q: 5 },
        { v: 4096, t: 12, Q: 6 },
        { v: 4096, t: 16, Q: 8 },
        { v: 4096, t: 20, Q: 10 }
      ];
      const item2_2 = randChoice(opts2_2);
      const ans2_2 = item2_2.Q;
      $('trainText2').innerHTML = `Скорость соединения равна <strong>${item2_2.v} Кбит/с</strong>. Какой объём данных (в <strong>МБайтах</strong>) будет передан за <strong>${item2_2.t} секунд</strong> (считай 1 МБайт = 1024 КБайт)?`;

      // 2.3: Скорость передачи v (в Мбит/с) — перевод объёма из КБайт в Мбит за t секунд
      const opts2_3 = [
        { Q: 2048, t: 4, v: 4 },
        { Q: 2048, t: 8, v: 2 },
        { Q: 3072, t: 3, v: 8 },
        { Q: 3072, t: 4, v: 6 },
        { Q: 3072, t: 6, v: 4 },
        { Q: 4096, t: 4, v: 8 },
        { Q: 4096, t: 8, v: 4 },
        { Q: 5120, t: 4, v: 10 },
        { Q: 5120, t: 5, v: 8 },
        { Q: 5120, t: 8, v: 5 },
        { Q: 5120, t: 10, v: 4 },
        { Q: 6144, t: 4, v: 12 },
        { Q: 6144, t: 6, v: 8 },
        { Q: 6144, t: 8, v: 6 },
        { Q: 8192, t: 4, v: 16 },
        { Q: 8192, t: 8, v: 8 },
        { Q: 10240, t: 8, v: 10 },
        { Q: 10240, t: 10, v: 8 }
      ];
      const item2_3 = randChoice(opts2_3);
      const ans2_3 = item2_3.v;
      $('trainText3').innerHTML = `За <strong>${item2_3.t} секунд</strong> по каналу был передан файл размером <strong>${item2_3.Q} КБайт</strong> (считай 1 МБайт = 1024 КБайт). Какова пропускная способность канала в <strong>Мбит/с</strong>?`;

      currTrainerAnswers = [String(ans2_1), String(ans2_2), String(ans2_3)];

      // Очищаем статус и поля
      resetLabBlock1();
      resetTrainerBlock2();
    }

    function updateOverallScore() {
      const total = scoreBlock1 + scoreBlock2;
      $('labTotalScore').textContent = `${total} из 10 баллов`;
    }

    function resetLabBlock1() {
      for (let i = 0; i < 4; i++) {
        const inp = $('labInp' + i);
        inp.value = '';
        inp.classList.remove('correct', 'wrong');
        $('labStat' + i).textContent = '-';
        $('labStat' + i).style.color = 'inherit';
      }
      scoreBlock1 = 0;
      $('labTasksFeedback').className = 'result';
      $('labTasksFeedback').textContent = 'Заполни поля и нажми «Проверить блок 1». Максимум: 4 балла.';
      updateOverallScore();
    }

    function resetTrainerBlock2() {
      for (let i = 1; i <= 3; i++) {
        const inp = $('trainInput' + i);
        inp.value = '';
        inp.classList.remove('correct', 'wrong');
        $('trainStat' + i).textContent = '-';
        $('trainStat' + i).style.color = 'inherit';
      }
      scoreBlock2 = 0;
      $('trainTasksFeedback').className = 'result';
      $('trainTasksFeedback').textContent = 'Введи ответы к трём задачам и нажми «Проверить блок 2». Максимум: 6 баллов.';
      updateOverallScore();
    }

    // Проверка Блока 1
    $('btnCheckLabTasks').onclick = () => {
      let okCount = 0;
      currLabAnswers.forEach((ans, idx) => {
        const inp = $('labInp' + idx);
        const stat = $('labStat' + idx);
        const val = inp.value.trim();
        inp.classList.remove('correct', 'wrong');

        if (val === ans) {
          okCount++;
          inp.classList.add('correct');
          stat.textContent = '✓';
          stat.style.color = '#354d31';
        } else {
          inp.classList.add('wrong');
          stat.textContent = '✕';
          stat.style.color = '#89332b';
        }
      });

      scoreBlock1 = okCount;
      const fb = $('labTasksFeedback');
      if (okCount === 4) {
        fb.className = 'result good';
        fb.textContent = 'Отлично! Все 4 расчёта выполнены верно (+4 балла).';
      } else {
        fb.className = 'result bad';
        fb.textContent = `Верно решено: ${okCount} из 4 задач. Проверь деление и умножение на 8.`;
      }
      updateOverallScore();
    };

    $('btnResetLabTasks').onclick = resetLabBlock1;

    // Проверка Блока 2
    $('btnCheckTrainer').onclick = () => {
      let okCount = 0;
      currTrainerAnswers.forEach((ans, idx) => {
        const inp = $('trainInput' + (idx + 1));
        const stat = $('trainStat' + (idx + 1));
        const val = inp.value.trim();
        inp.classList.remove('correct', 'wrong');

        if (val === ans) {
          okCount++;
          inp.classList.add('correct');
          stat.textContent = '✓';
          stat.style.color = '#354d31';
        } else {
          inp.classList.add('wrong');
          stat.textContent = '✕';
          stat.style.color = '#89332b';
        }
      });

      scoreBlock2 = okCount * 2;
      const fb = $('trainTasksFeedback');
      if (okCount === 3) {
        fb.className = 'result good';
        fb.textContent = 'Великолепно! Все 3 задачи решены верно (+6 баллов).';
      } else {
        fb.className = 'result bad';
        fb.textContent = `Верно решено: ${okCount} из 3 задач (+${scoreBlock2} баллов). Проверь расчёты по формуле.`;
      }
      updateOverallScore();
    };

    $('btnResetTrainer').onclick = resetTrainerBlock2;
    generateTasks();

    // -------------------------------------------------------------
    // СЛАЙД 6: РЕФЛЕКСИЯ
    // -------------------------------------------------------------
    function handleRef(btnId, msg, isGood) {
      $(btnId).onclick = () => {
        document.querySelectorAll('.reflection-btns .choice').forEach(b => b.classList.remove('selected'));
        $(btnId).classList.add('selected');
        $('refFeedback').style.display = 'block';
        $('refFeedback').className = 'result ' + (isGood ? 'good' : '');
        $('refFeedback').textContent = msg;
      };
    }
    handleRef('refGood', 'Отличная работа на уроке! Ты уверенно владеешь формулами и переводом единиц.', true);
    handleRef('refMid', 'Хороший результат! На следующих двух уроках мы закрепим решение практических задач.', false);
    handleRef('refHard', 'Ничего страшного! Главное запомнить: 1 Байт = 8 бит. На следующем уроке разберём это ещё раз.', false);

    // -------------------------------------------------------------
    // АНИМАЦИЯ ДВИЖЕНИЯ КРУЖОЧКОВ НА ФОНЕ (СЕТЕВЫЕ ЧАСТИЦЫ И СВЯЗИ)
    // -------------------------------------------------------------
    const bgCanvas = document.getElementById('network-bg');
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      let bgParticles = [];

      function initBgParticles() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        bgParticles = Array.from({ length: 46 }, () => ({
          x: Math.random() * bgCanvas.width,
          y: Math.random() * bgCanvas.height,
          vx: (Math.random() - 0.5) * 0.38,
          vy: (Math.random() - 0.5) * 0.38,
          r: Math.random() * 2 + 2
        }));
      }

      function drawBgNetwork() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.strokeStyle = 'rgba(105, 70, 45, 0.08)';
        bgCtx.fillStyle = 'rgba(185, 81, 50, 0.22)';

        bgParticles.forEach((point, index) => {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > bgCanvas.width) point.vx *= -1;
          if (point.y < 0 || point.y > bgCanvas.height) point.vy *= -1;

          bgCtx.beginPath();
          bgCtx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
          bgCtx.fill();

          for (let next = index + 1; next < bgParticles.length; next++) {
            const other = bgParticles[next];
            const distance = Math.hypot(point.x - other.x, point.y - other.y);
            if (distance < 140) {
              bgCtx.globalAlpha = (1 - distance / 140) * 0.65;
              bgCtx.beginPath();
              bgCtx.moveTo(point.x, point.y);
              bgCtx.lineTo(other.x, other.y);
              bgCtx.stroke();
              bgCtx.globalAlpha = 1;
            }
          }
        });

        requestAnimationFrame(drawBgNetwork);
      }

      window.addEventListener('resize', initBgParticles);
      initBgParticles();
      drawBgNetwork();
    }

    // Стартовая инициализация
    show((parseInt(location.hash.slice(1)) || 1) - 1);
  };

  /* Lesson 10emn-1-2 (10 ЕМН - 1–2 урок) */
  LESSON_SCRIPTS['10emn-1-2'] = function() {
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.getElementById('dots');
        const totalSlides = slides.length;

        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        const nextButtonLabels = [
            '',
            'К линии времени',
            'К разбору этапов',
            'К лаборатории',
            'К зимам ИИ',
            'К данным',
            'К технологиям',
            'К заданию',
            'К проверке',
            'К итогу'
        ];

        slides.forEach((slide, index) => {
            if (index === 0 || index === totalSlides - 1) return;
            const container = slide.querySelector('.container');
            if (!container) return;

            const actionRow = document.createElement('div');
            actionRow.className = 'slide-action-row';

            const button = document.createElement('button');
            button.className = 'nav-btn start-btn';
            button.type = 'button';
            button.innerHTML = `${nextButtonLabels[index] || 'Дальше'} <i class="fas fa-arrow-right"></i>`;
            button.onclick = () => changeSlide(1);

            actionRow.appendChild(button);
            container.appendChild(actionRow);
        });

        function updateUI() {
            slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
            document.querySelectorAll('.dot').forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
            document.getElementById('progress').style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }

        function changeSlide(direction) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + direction));
            updateUI();
        }

        function goToSlide(index) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, index));
            updateUI();
        }

        const eraData = {
            dream: {
                title: '1940-1950-е: машина как новая форма мышления',
                text: 'В этот период появляются первые электронные компьютеры и вопрос: можно ли описать мышление как вычисление? ИИ еще не умеет почти ничего, но рождается язык будущих исследований.',
                algorithm: 'Логика, поиск, первые математические модели нейронов.',
                tech: 'Огромные и медленные машины с маленькой памятью.',
                data: 'Данные почти не используются: программы больше зависят от правил и расчетов.',
                moments: [
                    { y: '1950', t: 'Тест Тьюринга', p: 'Алан Тьюринг предложил способ проверки "интеллекта" машины через беседу.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/220px-Alan_Turing_Aged_16.jpg' },
                    { y: '1951', t: 'Первые нейросети', p: 'Марвин Минский строит SNARC — первую систему, моделирующую нейрон.', img: 'https://images.unsplash.com/photo-1555255707-c07966488bc1?w=120&h=80&fit=crop' }
                ]
            },
            rules: {
                title: '1960-1970-е: символический ИИ',
                text: 'Ученые пытаются описать интеллект через символы и правила. Машина манипулирует понятиями, доказывает теоремы, играет в простые игры, но слабо понимает контекст.',
                algorithm: 'Правила “если-то”, логический вывод, перебор вариантов.',
                tech: 'Компьютеры становятся доступнее, но все еще слишком ограничены.',
                data: 'Больших цифровых массивов нет, поэтому знания вводят вручную.',
                moments: [
                    { y: '1966', t: 'ELIZA — первый чат-бот', p: 'Программа Джозефа Вейценбаума, пародирующая психотерапевта.', img: 'https://upload.wikimedia.org/wikipedia/commons/7/79/ELIZA_conversation.png' },
                    { y: '1970', t: 'Shakey the Robot', p: 'Первый робот, который мог рассуждать о своих действиях.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Shakey_the_robot_with_blocks.jpg/250px-Shakey_the_robot_with_blocks.jpg' }
                ]
            },
            expert: {
                title: '1980-е: экспертные системы',
                text: 'ИИ начинает приносить пользу в медицине, промышленности и диагностике. Но систему нужно вручную кормить правилами экспертов, а это дорого и хрупко.',
                algorithm: 'Базы знаний, цепочки вывода, экспертные правила.',
                tech: 'Корпоративные компьютеры и рабочие станции помогают внедрять системы.',
                data: 'Главный источник знаний - интервью со специалистами, а не массовые датасеты.',
                moments: [
                    { y: '1980', t: 'Система XCON', p: 'ИИ начал экономить компаниям (DEC) миллионы долларов на конфигурациях заказов.', img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=120&h=80&fit=crop' },
                    { y: '1982', t: 'Япония: 5-е поколение', p: 'Амбициозный проект создания компьютеров будущего на основе логики.', img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=120&h=80&fit=crop' }
                ]
            },
            learn: {
                title: '1990-2000-е: машинное обучение',
                text: 'Фокус смещается: не программировать каждое правило, а обучать модель на примерах. ИИ становится статистическим и начинает выигрывать там, где есть данные.',
                algorithm: 'Деревья решений, метод опорных векторов, байесовские модели, ансамбли.',
                tech: 'Персональные компьютеры, серверы и интернет ускоряют эксперименты.',
                data: 'Появляются цифровые базы, поисковые системы, транзакции, клики и тексты.',
                moments: [
                    { y: '1997', t: 'Deep Blue против Каспарова', p: 'Компьютер впервые победил чемпиона мира в шахматах в матче.', img: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Deep_Blue.jpg' },
                    { y: '2000-е', t: 'Цифровой след', p: 'Поисковые системы Google стали собирать данные миллиардов людей.', img: 'https://images.unsplash.com/photo-1542744095-2ad4870f79ec?w=120&h=80&fit=crop' }
                ]
            },
            deep: {
                title: '2012-2020-е: глубокое обучение',
                text: 'Глубокие нейросети показывают резкий рост качества в изображениях, речи и переводе. Старые идеи нейросетей наконец получают нужную мощность и данные.',
                algorithm: 'Многослойные нейронные сети, сверточные сети, обратное распространение ошибки.',
                tech: 'GPU позволяют параллельно обучать большие модели.',
                data: 'Миллионы изображений, аудио, текстов и пользовательских действий.',
                moments: [
                    { y: '2012', t: 'Прорыв ImageNet', p: 'Нейросеть AlexNet показала невероятную точность в зрении на базе видеокарт.', img: 'https://images.unsplash.com/photo-1620712943543-bcc4628c9759?w=120&h=80&fit=crop' },
                    { y: '2022+', t: 'ChatGPT и GenAI', p: 'Модели научились понимать смысл и генерировать человеческий текст.', img: 'https://images.unsplash.com/photo-1673603819417-640a32219760?w=120&h=80&fit=crop' }
                ]
            },
            gen: {
                title: '2020-е: генеративный ИИ',
                text: 'Модели начинают не только классифицировать, но и создавать: текст, изображения, код, звук. Возникает вопрос не “может ли ИИ распознать?”, а “как его ответственно использовать?”.',
                algorithm: 'Трансформеры, большие языковые модели, диффузионные модели.',
                tech: 'Кластеры GPU, облачные платформы, оптимизация обучения.',
                data: 'Огромные корпуса текстов, изображений, кода и диалогов.'
            }
        };

        function renderEra(key) {
            const era = eraData[key];
            document.querySelectorAll('.era-btn').forEach((button) => {
                button.classList.toggle('active', button.getAttribute('onclick').includes(`'${key}'`));
            });

            document.getElementById('eraContent').innerHTML = `
                <h3>${era.title}</h3>
                <p>${era.text}</p>
                <div class="mini-grid">
                    <div class="mini"><strong>Алгоритмы</strong><p>${era.algorithm}</p></div>
                    <div class="mini"><strong>Технологии</strong><p>${era.tech}</p></div>
                    <div class="mini"><strong>Данные</strong><p>${era.data}</p></div>
                </div>
                
            `;
        }

        const algRange = document.getElementById('algRange');
        const computeRange = document.getElementById('computeRange');
        const dataRange = document.getElementById('dataRange');

        function updateLab() {
            const algorithm = Number(algRange.value);
            const compute = Number(computeRange.value);
            const data = Number(dataRange.value);
            const bottleneck = Math.min(algorithm, compute, data);
            const average = Math.round((algorithm + compute + data) / 3);
            const score = Math.round(average * 0.55 + bottleneck * 0.45);
            const model = Math.round((algorithm * 0.5 + data * 0.35 + compute * 0.15));
            const speed = Math.round((compute * 0.7 + algorithm * 0.2 + data * 0.1));
            const world = Math.round((data * 0.65 + algorithm * 0.25 + compute * 0.1));

            document.getElementById('algLabel').textContent = algorithm;
            document.getElementById('computeLabel').textContent = compute;
            document.getElementById('dataLabel').textContent = data;
            document.getElementById('powerScore').textContent = score;
            document.getElementById('modelScore').textContent = `${model}%`;
            document.getElementById('speedScore').textContent = `${speed}%`;
            document.getElementById('worldScore').textContent = `${world}%`;
            document.getElementById('modelFill').style.width = `${model}%`;
            document.getElementById('speedFill').style.width = `${speed}%`;
            document.getElementById('worldFill').style.width = `${world}%`;

            const weakest = [
                ['алгоритмы', algorithm],
                ['вычисления', compute],
                ['данные', data]
            ].sort((a, b) => a[1] - b[1])[0][0];

            const text = score > 78
                ? 'Все три фактора достаточно сильны. Такая ситуация похожа на эпохи больших прорывов: можно обучать сложные модели на больших данных.'
                : `Главное ограничение сейчас - ${weakest}. Именно слабое звено объясняет, почему развитие ИИ в разные эпохи могло замедляться.`;

            document.getElementById('powerText').textContent = score > 78
                ? 'Условия почти идеальные: модель может становиться мощной, масштабной и полезной.'
                : 'Система уже может решать отдельные задачи, но масштабный прорыв ограничен одним из факторов.';
            document.getElementById('labInsight').innerHTML = `<p><b>Вывод:</b> ${text}</p>`;
        }

        [algRange, computeRange, dataRange].forEach((input) => input.addEventListener('input', updateLab));

        const quizQuestions = [
            {
                question: 'Почему символический ИИ 1960-1970-х плохо справлялся с реальным миром?',
                answer: 'Потому что реальность трудно полностью описать ручными правилами и исключениями',
                options: ['Потому что тогда вообще не было компьютеров', 'Потому что ИИ умел только создавать изображения', 'Потому что данные были слишком большими для человека'],
                feedback: 'Верно: правила работают в узких задачах, но плохо выдерживают неоднозначность языка, зрения и поведения людей.'
            },
            {
                question: 'Что сильнее всего отличает машинное обучение от экспертных систем?',
                answer: 'Модель учится на примерах, а не только выполняет заранее записанные правила',
                options: ['Машинное обучение не использует данные', 'Экспертные системы всегда работают быстрее современных моделей', 'Машинное обучение появилось раньше первых компьютеров'],
                feedback: 'Точно: сдвиг от ручных правил к обучению на данных стал ключевым поворотом в истории ИИ.'
            },
            {
                question: 'Почему глубокое обучение резко усилилось после 2010-х?',
                answer: 'Сошлись нейросетевые методы, мощные GPU и большие датасеты',
                options: ['Ученые впервые придумали слово “алгоритм”', 'Компьютеры перестали использовать математику', 'Все программы стали писать без данных'],
                feedback: 'Верно: старые идеи нейросетей получили новую силу благодаря вычислениям и данным.'
            },
            {
                question: 'Что такое “зима ИИ”?',
                answer: 'Период падения интереса и финансирования из-за завышенных ожиданий и слабых результатов',
                options: ['Время, когда ИИ применяли только зимой', 'Этап, когда ИИ полностью исчез из науки', 'Период запрета на использование компьютеров'],
                feedback: 'Да: зима ИИ показывает, что развитие технологий зависит не только от идей, но и от реальных возможностей эпохи.'
            },
            {
                question: 'Почему увеличение данных не всегда автоматически улучшает ИИ?',
                answer: 'Данные могут быть шумными, однобокими, ошибочными или плохо размеченными',
                options: ['Чем больше данных, тем модель всегда честнее', 'Данные не влияют на обучение моделей', 'Большие данные нужны только для игр'],
                feedback: 'Правильно: важен не только объем, но и качество, разнообразие и корректная разметка.'
            },
            {
                question: 'Как лучше объяснить развитие генеративного ИИ 2020-х?',
                answer: 'Через сочетание трансформеров, огромных корпусов данных и мощных вычислительных кластеров',
                options: ['Только через желание пользователей получать красивые ответы', 'Только через появление смартфонов', 'Только через ручное написание всех возможных ответов'],
                feedback: 'Именно: генеративный ИИ стал возможен благодаря совместному росту алгоритмов, данных и инфраструктуры.'
            }
        ];

        let quizOrder = [];
        let quizIndex = 0;
        let quizScore = 0;
        let waitingForNext = false;
        const quizQuestion = document.getElementById('quizQuestion');
        const quizOptions = document.getElementById('quizOptions');
        const quizFeedback = document.getElementById('quizFeedback');
        const quizCounter = document.getElementById('quizCounter');
        const quizScoreLabel = document.getElementById('quizScore');

        function shuffle(items) {
            const result = [...items];
            for (let index = result.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }
            return result;
        }

        function startQuiz() {
            quizOrder = shuffle(quizQuestions);
            quizIndex = 0;
            quizScore = 0;
            waitingForNext = false;
            renderQuizQuestion();
        }

        function renderQuizQuestion() {
            const current = quizOrder[quizIndex];
            const options = shuffle([current.answer, ...current.options]);
            quizCounter.textContent = `Вопрос ${quizIndex + 1} / ${quizOrder.length}`;
            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;
            quizQuestion.textContent = current.question;
            quizFeedback.textContent = 'Выберите ответ.';
            quizOptions.innerHTML = '';
            waitingForNext = false;

            options.forEach((text) => {
                const button = document.createElement('button');
                button.className = 'quiz-option';
                button.type = 'button';
                button.textContent = text;
                button.onclick = () => answerQuiz(button, text === current.answer, current.feedback);
                quizOptions.appendChild(button);
            });
        }

        function answerQuiz(selectedButton, isCorrect, feedback) {
            if (waitingForNext) return;
            waitingForNext = true;

            document.querySelectorAll('.quiz-option').forEach((button) => {
                button.disabled = true;
                if (button.textContent === quizOrder[quizIndex].answer) button.classList.add('correct');
            });

            if (isCorrect) {
                quizScore += 1;
                selectedButton.classList.add('correct');
                quizFeedback.textContent = feedback;
            } else {
                selectedButton.classList.add('wrong');
                quizFeedback.textContent = `${feedback} Правильный ответ: ${quizOrder[quizIndex].answer}`;
            }

            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;

            window.setTimeout(() => {
                quizIndex += 1;
                if (quizIndex >= quizOrder.length) {
                    quizCounter.textContent = 'Квиз завершен';
                    quizQuestion.textContent = `Результат: ${quizScore} из ${quizOrder.length}`;
                    quizOptions.innerHTML = '<button class="quiz-option" type="button" id="restartQuiz">Пройти еще раз в новом порядке</button>';
                    quizFeedback.textContent = quizScore >= 5
                        ? 'Отлично: вы уверенно связываете этапы ИИ с алгоритмами, технологиями и данными.'
                        : 'Неплохо. Пройдите еще раз и обращайте внимание на слабое звено каждой эпохи: данные, мощность или методы.';
                    document.getElementById('restartQuiz').onclick = startQuiz;
                    waitingForNext = false;
                    return;
                }
                renderQuizQuestion();
            }, 1800);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') changeSlide(1);
            if (event.key === 'ArrowLeft') changeSlide(-1);
        });

        const canvas = document.getElementById('network-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = Array.from({ length: 58 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.34,
                vy: (Math.random() - 0.5) * 0.34,
                r: 1.4 + Math.random() * 1.9
            }));
        }

        function drawNetwork() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.09)';
            ctx.fillStyle = 'rgba(8, 145, 178, 0.16)';

            particles.forEach((point, index) => {
                point.x += point.vx;
                point.y += point.vy;
                if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
                if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
                ctx.fill();

                for (let next = index + 1; next < particles.length; next++) {
                    const other = particles[next];
                    const distance = Math.hypot(point.x - other.x, point.y - other.y);
                    if (distance < 150) {
                        ctx.globalAlpha = 1 - distance / 150;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            });

            requestAnimationFrame(drawNetwork);
        }

        window.addEventListener('resize', initParticles);
        renderEra('dream');
        updateLab();
        startQuiz();
        updateUI();
        initParticles();
        drawNetwork();
  };

  /* Lesson 10emn-3 (10 ЕМН - 3 урок) */
  LESSON_SCRIPTS['10emn-3'] = function() {
const slides=[...document.querySelectorAll(".slide")],bar=document.getElementById("progress"),dotsNav=document.getElementById("dotsNav");let current=0;
const dotLabels=["Старт","Повторение","Смена подхода","Карта понятий","Данные","Признаки","Обучение","Модель","Прогноз","Итог","Завершение"];
const imageModal=document.getElementById("imageModal");document.querySelector(".zoomable-image").onclick=()=>imageModal.showModal();imageModal.querySelector("button").onclick=()=>imageModal.close();imageModal.onclick=e=>{if(e.target===imageModal)imageModal.close()};
slides.forEach((slide,n)=>{const dot=document.createElement("button");dot.className="dot";dot.type="button";dot.dataset.label=dotLabels[n]||`Слайд ${n+1}`;dot.title=dot.dataset.label;dot.setAttribute("aria-label","Перейти к слайду: "+dot.dataset.label);dot.onclick=()=>show(n);dotsNav.appendChild(dot);const nextBtn=document.createElement("button");nextBtn.className="slide-next";nextBtn.type="button";nextBtn.textContent=n===slides.length-1?"В начало":"Далее →";nextBtn.onclick=()=>show(n===slides.length-1?0:n+1);slide.appendChild(nextBtn)});
const dots=[...document.querySelectorAll(".dot")];
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle("active",n===current));dots.forEach((d,n)=>d.classList.toggle("active",n===current));bar.style.width=((current+1)/slides.length*100)+"%";mobilePrev.disabled=current===0;mobileNext.disabled=current===slides.length-1}
mobilePrev.onclick=()=>show(current-1);mobileNext.onclick=()=>show(current+1);
function toggleFullScreen(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}
document.addEventListener("keydown",e=>{if(imageModal.open)return;const typing=["INPUT","TEXTAREA"].includes(document.activeElement.tagName);if(!typing&&["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==="f")toggleFullScreen()});
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const recallBank=[
{q:"Какое событие 1956 года закрепило название «искусственный интеллект»?",a:"Дартмутский семинар",w:["Создание первого смартфона","Появление интернета","Запуск ChatGPT"]},
{q:"Что проверяет тест Тьюринга?",a:"Можно ли в диалоге отличить ответы машины от ответов человека",w:["Скорость вычислений компьютера","Объём памяти программы","Умеет ли робот самостоятельно двигаться"]},
{q:"Что называют «зимой искусственного интеллекта»?",a:"Период снижения интереса и финансирования из-за несбывшихся ожиданий",w:["Запрет компьютеров в холодное время года","Этап, когда ИИ работал только с прогнозом погоды","Период полного исчезновения исследований ИИ"]},
{q:"Почему данные стали одним из двигателей современного ИИ?",a:"Большие наборы примеров позволяют моделям находить сложные закономерности",w:["Данные полностью заменили алгоритмы","Чем больше файлов, тем любой ответ автоматически вернее","Данные нужны только для хранения результатов"]},
{q:"Как вычислительные мощности повлияли на развитие ИИ?",a:"Позволили быстрее обучать более сложные модели",w:["Сделали обучающие данные ненужными","Автоматически устранили все ошибки моделей","Заменили необходимость в алгоритмах"]},
{q:"Почему системы вроде ChatGPT стали возможны именно сейчас?",a:"Совместились большие данные, новые алгоритмы и мощные вычисления",w:["Появилось одно универсальное правило для всех вопросов","Компьютеры научились работать без обучения","Причиной стало только увеличение скорости интернета"]}
];
let recallOrder=[],recallIndex=0,recallPoints=0,recallLocked=false;
function renderRecall(){const item=recallOrder[recallIndex];recallLocked=false;recallCount.textContent="Вопрос "+(recallIndex+1)+" / 6";recallScore.textContent="Верно: "+recallPoints;recallQuestion.textContent=item.q;recallFeedback.textContent="Выберите наиболее точный ответ.";recallNext.hidden=true;recallOptions.innerHTML="";shuffle([item.a,...item.w]).forEach(text=>{const b=document.createElement("button");b.className="quizoption";b.textContent=text;b.onclick=()=>answerRecall(b,item);recallOptions.appendChild(b)})}
function answerRecall(button,item){if(recallLocked)return;recallLocked=true;const ok=button.textContent===item.a;if(ok)recallPoints++;document.querySelectorAll(".quizoption").forEach(b=>{b.disabled=true;if(b.textContent===item.a)b.classList.add("correct")});if(!ok)button.classList.add("wrong");recallScore.textContent="Верно: "+recallPoints;recallFeedback.textContent=ok?"Верно!":"Зелёным отмечен точный ответ.";recallNext.hidden=false;recallNext.textContent=recallIndex===5?"Завершить тест":"Следующий →"}
function finishRecall(){recallCount.textContent="Тест завершён";recallScore.textContent="Результат: "+recallPoints+" / 6";recallQuestion.textContent=recallPoints>=5?"История ИИ усвоена — двигаемся дальше!":recallPoints>=3?"Неплохо. Обсудите ошибки перед новой темой.":"Повторите ключевые этапы развития ИИ.";recallOptions.innerHTML="";recallFeedback.textContent="";recallNext.hidden=false;recallNext.textContent="Пройти ещё раз ↻";recallNext.onclick=startRecall}
function nextRecall(){if(recallIndex<5){recallIndex++;renderRecall()}else finishRecall()}
function startRecall(){recallOrder=shuffle([...recallBank]);recallIndex=0;recallPoints=0;recallNext.onclick=nextRecall;renderRecall()}
document.querySelectorAll(".pipe").forEach(pipe=>pipe.onclick=()=>{document.querySelectorAll(".pipe").forEach(x=>x.classList.remove("active"));pipe.classList.add("active");pipeInfo.textContent=pipe.dataset.info});
let trained=false;
trainModel.onclick=()=>{trained=!trained;trainChart.classList.toggle("untrained",!trained);[step1,step2,step3].forEach(x=>x.classList.remove("active"));if(trained){step3.classList.add("active");errorBadge.textContent="Ошибка: уменьшилась";trainModel.textContent="Сбросить обучение"}else{step1.classList.add("active");errorBadge.textContent="Ошибка: большая";trainModel.textContent="Обучить модель"}};
document.querySelectorAll(".task .choice").forEach(choice=>choice.onclick=()=>{choice.closest(".choices").querySelectorAll(".choice").forEach(x=>x.classList.remove("selected"));choice.classList.add("selected");choice.closest(".task").classList.remove("correct","wrong")});
checkMission.onclick=()=>{let score=0,answered=0;document.querySelectorAll(".task").forEach(task=>{const selected=task.querySelector(".selected");task.classList.remove("correct","wrong");if(!selected)return;answered++;const ok=selected.dataset.value===task.dataset.answer;task.classList.add(ok?"correct":"wrong");if(ok)score+=2});missionScore.textContent="Результат: "+score+" / 10";missionFeedback.textContent=answered<5?"Ответьте ещё на "+(5-answered)+" задан.":score>=9?"Отлично: понятия связаны верно!":score>=7?"Хорошо. Проверьте одну неточность.":score>=5?"Основа есть — повторите конвейер.":"Вернитесь к объяснению и попробуйте снова."};
resetMission.onclick=()=>{document.querySelectorAll(".task").forEach(x=>x.classList.remove("correct","wrong"));document.querySelectorAll(".task .choice").forEach(x=>x.classList.remove("selected"));missionScore.textContent="Результат: — / 10";missionFeedback.textContent=""};

const canvas=document.getElementById('network-bg');
const ctx=canvas.getContext('2d');
let particles=[];
function initParticles(){
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  particles=Array.from({length:54},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.34,vy:(Math.random()-.5)*.34,r:1.4+Math.random()*2.2}));
}
function drawNetwork(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(124, 77, 255, 0.10)';
  ctx.fillStyle='rgba(94, 234, 212, 0.18)';
  particles.forEach((point,index)=>{
point.x += point.vx; point.y += point.vy;
if(point.x < 0 || point.x > canvas.width) point.vx *= -1;
if(point.y < 0 || point.y > canvas.height) point.vy *= -1;
ctx.beginPath(); ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2); ctx.fill();
for(let next=index+1; next<particles.length; next++){
  const other=particles[next];
  const distance=Math.hypot(point.x-other.x, point.y-other.y);
  if(distance < 150){
    ctx.globalAlpha = 1 - distance / 150;
    ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(other.x, other.y); ctx.stroke();
    ctx.globalAlpha=1;
  }
}
  });
  requestAnimationFrame(drawNetwork);
}
window.addEventListener('resize', initParticles);
initParticles(); drawNetwork();
startRecall();show(Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1)));
  };

  /* Lesson 10emn-4 (10 ЕМН - 4 урок) */
  LESSON_SCRIPTS['10emn-4'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav');
const dotLabels=['01 · Начало','02 · Как это работает','03 · Задание','04 · Дискриптор'];
let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.dataset.label=dotLabels[n]||`Слайд ${n+1}`;dot.title=dot.dataset.label;dot.setAttribute('aria-label','Перейти к слайду: '+dot.dataset.label);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});
const dots=[...document.querySelectorAll('.dot')];
const mobilePrev=document.getElementById('mobilePrev');const mobileNext=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';mobilePrev.disabled=current===0;mobileNext.disabled=current===slides.length-1}
mobilePrev.onclick=()=>show(current-1);mobileNext.onclick=()=>show(current+1);
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){if(document.fullscreenElement){document.exitFullscreen?.()}else{document.documentElement.requestFullscreen?.()}}});
const canvas=document.getElementById('network-bg');
const ctx=canvas.getContext('2d');
let particles=[];
function initParticles(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;particles=Array.from({length:54},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.34,vy:(Math.random()-.5)*.34,r:1.4+Math.random()*2.2}));}
function drawNetwork(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.10)';ctx.fillStyle='rgba(94,234,212,.18)';particles.forEach((point,index)=>{point.x+=point.vx;point.y+=point.vy;if(point.x<0||point.x>canvas.width)point.vx*=-1;if(point.y<0||point.y>canvas.height)point.vy*=-1;ctx.beginPath();ctx.arc(point.x,point.y,point.r,0,Math.PI*2);ctx.fill();for(let next=index+1;next<particles.length;next++){const other=particles[next];const distance=Math.hypot(point.x-other.x,point.y-other.y);if(distance<150){ctx.globalAlpha=1-distance/150;ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(other.x,other.y);ctx.stroke();ctx.globalAlpha=1;}}});requestAnimationFrame(drawNetwork)}
window.addEventListener('resize',initParticles);initParticles();drawNetwork();show(0);
  };

  /* Lesson 10emn-5 (10 ЕМН - 5 урок) */
  LESSON_SCRIPTS['10emn-5'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),dotLabels=['01 · Старт','02 · История','03 · Структура','04 · Взвешенная сумма','05 · Функция активации','06 · Ограничения','07 · Практика','08 · Оценивание'];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1}prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
document.querySelectorAll('.click-node,.click-sum,.click-activation,.weight-badge').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.click-node,.click-sum,.click-activation,.weight-badge').forEach(item=>item.classList.remove('active'));button.classList.add('active');document.getElementById('clickInfo').innerHTML=button.dataset.info}));
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
  };

  /* Lesson 10emn-6 (10 ЕМН - 6 урок) */
  LESSON_SCRIPTS['10emn-6'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),dotLabels=['01 · Старт','02 · Повторение','03 · Практика','04 · Excel','05 · Итог и дескрипторы'];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1;if(slides[current].classList.contains('excel-slide'))window.getSelection()?.removeAllRanges()}prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);
// Classroom restriction for the Excel slide only; normal navigation remains available.
const excelSlide=document.querySelector('.excel-slide');
['selectstart','dragstart','contextmenu'].forEach(type=>excelSlide.addEventListener(type,e=>e.preventDefault()));
['copy','cut'].forEach(type=>document.addEventListener(type,e=>{if(excelSlide.classList.contains('active'))e.preventDefault()}));
document.addEventListener('keydown',e=>{
if(!excelSlide.classList.contains('active'))return;
const command=e.ctrlKey||e.metaKey;
if((command&&(['KeyA','KeyC','KeyX'].includes(e.code)||['a','c','x'].includes(e.key.toLowerCase())))||(e.ctrlKey&&e.key==='Insert')||(e.shiftKey&&e.key==='Delete'))e.preventDefault();
});
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
let held=null;const chips=[...document.querySelectorAll('.chip')],zones=[...document.querySelectorAll('.drop-zone')],experience=document.getElementById('recallExperience');const elementZones=zones.filter(z=>z.dataset.set==='element'),roleZones=zones.filter(z=>z.dataset.set==='description');function elementsReady(){return elementZones.every(z=>z.querySelector('.chip'))}function unlockRoles(){experience.classList.add('roles-unlocked')}function place(chip,zone){if(!chip||!zone||chip.dataset.kind!==zone.dataset.kind||chip.dataset.set!==zone.dataset.set)return false;const old=zones.find(z=>z.dataset.kind===chip.dataset.kind&&z.dataset.set===chip.dataset.set&&z.contains(chip));if(old){old.classList.remove('filled');old.innerHTML='<small>'+old.dataset.label+'</small>'}zone.dataset.label=zone.innerHTML;zone.innerHTML='';zone.append(chip);zone.classList.add('filled');held=null;chips.forEach(c=>c.classList.remove('selected'));if(chip.dataset.set==='element'&&elementsReady())unlockRoles();return true}chips.forEach(chip=>{chip.addEventListener('dragstart',e=>{held=chip;e.dataTransfer.effectAllowed='move'});chip.addEventListener('click',()=>{held=chip;chips.forEach(c=>c.classList.toggle('selected',c===chip))})});zones.forEach(zone=>{zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');place(held,zone)});zone.addEventListener('click',()=>place(held,zone))});
const status=document.getElementById('recallStatus');document.getElementById('checkRecall').onclick=()=>{if(!elementsReady()){status.textContent='Сначала соберите схему из элементов.';status.className='status bad';return}if(!roleZones.every(z=>z.querySelector('.chip'))){status.textContent='Теперь распределите роли под элементами схемы.';status.className='status bad';return}status.textContent='Верно! Схема и роли собраны.';status.className='status ok'};document.getElementById('resetRecall').onclick=()=>{elementZones.forEach(z=>z.innerHTML='<small>'+({inputs:'Начало',weights:'Связи',sum:'Обработка',activation:'Решение',output:'Конец'})[z.dataset.kind]+'</small>');roleZones.forEach(z=>z.innerHTML='<small>'+({inputs:'Роль входов',weights:'Роль весов',sum:'Роль сумматора',activation:'Роль активации',output:'Роль выхода'})[z.dataset.kind]+'</small>');zones.forEach(z=>z.classList.remove('filled'));const elementTray=document.getElementById('elementTray'),descTray=document.getElementById('descTray');chips.forEach(c=>(c.dataset.set==='description'?descTray:elementTray).append(c));experience.classList.remove('roles-unlocked');held=null;status.textContent='';status.className='status'};
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
  };

  /* Lesson 10emn-7 (10 ЕМН - 7 урок) */
  LESSON_SCRIPTS['10emn-7'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),dotLabels=['01 · Титул','02 · Задание','03 · Итог'];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1;}
prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);
const downloadLinks=[...document.querySelectorAll('a[download]')];downloadLinks.forEach(link=>{link.addEventListener('click',()=>{const randomName='perceptron-' + Math.random().toString(36).slice(2,8) + '-' + Date.now(); link.setAttribute('download', randomName + '.xlsx');});});
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
  };

  /* Lesson 10emn-8 (10 ЕМН - 8 урок) */
  LESSON_SCRIPTS['10emn-8'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),dotLabels=["01 · Титул", "02 · Что такое МО", "03 · Три парадигмы", "04 · С учителем", "05 · Без учителя", "06 · С подкреплением", "07 · Сравнение", "08 · Задание", "09 · Дескриптор"];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){document.querySelectorAll("[data-demo]").forEach(panel=>panel.pauseDemo?.());current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1;}
prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable;if(!typing&&(['ArrowRight','PageDown'].includes(e.key)||(e.key===' '&&!document.activeElement.closest('button,summary,a')))){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});if(!matchMedia("(prefers-reduced-motion: reduce)").matches)requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
const demoFrames={"supervised": [["Обучающие данные", "Ответы уже приложены", "В наборе есть письма и метки. По словам, ссылкам и другим признакам модель ищет связь с ответом «спам / не спам»."], ["Прогноз и ошибка", "Сверяемся с меткой", "Для письма «Получите приз!» модель предположила «не спам». В данных метка «спам»: прогноз неверный. Ошибка показывает, что параметры нужно изменить."], ["Обучение", "Исправляем на многих примерах", "Алгоритм корректирует параметры, чтобы уменьшать ошибку. Цикл повторяется на множестве писем. Одной удачной попытки недостаточно."], ["После обучения", "Новое письмо без готового ответа", "Подаём признаки нового письма. Модель выдаёт прогноз «спам». Метку на вход не подаём. Верность прогноза ещё нужно проверить: модель может ошибаться."]], "unsupervised": [["Данные без меток", "Одна точка — один покупатель", "Положение точки показывает частоту покупок и средний чек. Все точки пока одного цвета: готовых названий групп нет."], ["Сходство", "Сравниваем по двум признакам", "Соседние точки означают похожие показатели. Фиолетовый отрезок соединяет близкие объекты, оранжевый — далёкие. Перед сравнением масштаб признаков согласуют."], ["Группировка", "В этом примере видны три группы", "Одинаковый цвет обозначает один кластер. Покупатели никуда не переместились: алгоритм сгруппировал их по сходству. Не в каждом наборе будет ровно три группы."], ["Объяснение результата", "Названия групп даёт человек", "Теперь можно описать кластеры: например, «часто покупают, небольшой чек». Эти названия появились после анализа, а не были метками для обучения."]], "reinforcement": [["Начало эпизода", "Готового маршрута нет", "Робот видит своё положение и препятствия. Он выбирает действие. Цель — дойти до звезды и получить высокую суммарную награду."], ["Попытка вправо · −5", "Столкновение со стеной", "Робот остаётся на месте и получает штраф −5. Это обратная связь о последствиях, а не подсказка всего правильного маршрута."], ["Шаг вверх · −1", "Пробуем обход", "Другой ход свободен. За обычный шаг робот получает −1: лишние перемещения будут уменьшать суммарную награду."], ["Шаг вправо · −1", "Продолжаем исследовать", "Робот находится над препятствием. Он получает новое состояние среды и снова выбирает действие."], ["Шаг вправо · −1", "Награда может прийти позже", "Сейчас награда отрицательная, но этот шаг может приблизить к будущим +10. Важна сумма за весь путь."], ["Шаг вправо · −1", "Обходим вторую стену", "На этом участке можно пройти безопасно. Робот собирает опыт: состояние, действие и награду."], ["Шаг вправо · −1", "Остался один шаг", "Цель находится снизу. Путь над препятствиями позволяет обойти обе стены."], ["Шаг вниз · +10", "Цель достигнута", "За доставку получено +10. В эпизоде было столкновение −5 и пять обычных шагов по −1: итоговая награда 0."], ["Итог эпизода", "Без столкновения выгоднее", "Этот же обход без первого столкновения дал бы +5: пять шагов по −1 и +10 за цель. На множестве попыток алгоритм учится выбирать более выгодную стратегию."]]};

const robotPositions=[[96,166],[96,166],[96,76],[186,76],[276,76],[366,76],[456,76],[456,166],[456,166]];
document.querySelectorAll('[data-demo]').forEach(panel=>{
 const key=panel.dataset.demo, frames=demoFrames[key];let index=0,timer=null;
 const zoom=panel.querySelector('.diagram-zoom'),viewport=panel.querySelector('.diagram-viewport');
 zoom.onclick=()=>{const enlarged=viewport.classList.toggle('enlarged');zoom.setAttribute('aria-pressed',String(enlarged));zoom.textContent=enlarged?'⤡ Вся схема':'⤢ Увеличить схему';panel.querySelector('.diagram-note').textContent=enlarged?'Прокрутите схему вбок, чтобы рассмотреть подписи.':'Учебная схема: шаги можно листать вручную или запустить анимацию.'};
 const back=panel.querySelector('.demo-back'),nextStep=panel.querySelector('.demo-next'),play=panel.querySelector('.demo-play'),reset=panel.querySelector('.demo-reset');
 function pause(){clearInterval(timer);timer=null;panel.classList.remove('demo-playing');play.textContent='▶ Анимация';play.setAttribute('aria-pressed','false')}
 panel.pauseDemo=pause;
 function render(){
  panel.dataset.step=index;panel.querySelector('.demo-stage').textContent=frames[index][0];panel.querySelector('.demo-title').textContent=frames[index][1];panel.querySelector('.demo-text').textContent=frames[index][2];panel.querySelector('.demo-count').textContent=(index+1)+' / '+frames.length;back.disabled=index===0;nextStep.disabled=index===frames.length-1;
  if(key==='supervised'){
   const values=index===3?{inputTitle:'Новое письмо',example1:'«Выгодная акция!»',label1:'метки нет',example2:'Слова, ссылки…',label2:'входные признаки',modelState:'уже обучена',prediction:'спам',verdict:'это прогноз',feedback:'',bottom:'Прогноз для нового примера может оказаться неверным.'}:{inputTitle:'Письма с метками',example1:'«Получите приз!»',label1:'метка: спам',example2:'«Встреча в 15:00»',label2:'метка: не спам',modelState:index===2?'корректировка':'ищет связь',prediction:index===0?'ещё не проверен':index===1?'не спам':'учимся дальше',verdict:index===1?'метка: спам':index===2?'повторяем цикл':'сравним с меткой',feedback:index===1?'обнаружена ошибка':index===2?'меняем параметры':'сравнение с ответом',bottom:'При обучении правильные ответы уже известны.'};
   Object.entries(values).forEach(([name,text])=>panel.querySelector('[data-super="'+name+'"]').textContent=text);
  }
  if(key==='reinforcement'){const [x,y]=robotPositions[index];panel.querySelector('.robot-token').setAttribute('transform','translate('+x+' '+y+')');panel.classList.toggle('route-visible',index===8)}
 }
 back.onclick=()=>{pause();index=Math.max(0,index-1);render()};nextStep.onclick=()=>{pause();index=Math.min(frames.length-1,index+1);render()};reset.onclick=()=>{pause();index=0;render()};
 play.onclick=()=>{if(timer){pause();return}if(index===frames.length-1){index=0;render()}panel.classList.add('demo-playing');play.textContent='Ⅱ Пауза';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{if(!panel.closest('.slide').classList.contains('active')){pause();return}index++;render();if(index===frames.length-1)pause()},key==='reinforcement'?2100:3800)};
 play.setAttribute('aria-pressed','false');render();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('[data-demo]').forEach(panel=>panel.pauseDemo())});





const cityMissions=[{"name": "Сортировка писем", "title": "Научите почту узнавать спам", "story": "Городская почта хочет автоматически проверять новые письма. Для обучения подготовлены старые письма с ответами.", "clue": "В наборе 5 000 писем. У каждого уже есть метка «спам» или «не спам».", "groups": [{"title": "1. Выберите вид обучения", "options": ["Без учителя", "С учителем", "С подкреплением"], "correct": 1, "explanation": "С учителем: готовые метки позволяют сравнивать прогноз с известным ответом."}, {"title": "2. Что передать для обучения?", "options": ["Только адреса отправителей, без ответов", "Только список слов «приз» и «скидка»", "Признаки писем вместе с метками"], "correct": 2, "explanation": "Нужны признаки писем и соответствующие метки. Один список подозрительных слов не заменяет обучающие примеры."}]}, {"name": "Группы пассажиров", "title": "Найдите похожие поездки", "story": "Транспортная служба собирает длительность и частоту поездок. Никто заранее не распределял пассажиров по категориям.", "clue": "Есть признаки поездок, но нет столбца «правильная группа». Нужно найти сходство в данных.", "groups": [{"title": "1. Выберите вид обучения", "options": ["Без учителя", "С подкреплением", "С учителем"], "correct": 0, "explanation": "Без учителя: алгоритм ищет структуру в данных без готовых меток."}, {"title": "2. Какой результат ожидается?", "options": ["Группы с похожими показателями поездок", "Готовые метки, известные ещё до анализа", "Награда за каждый шаг робота"], "correct": 0, "explanation": "Результат — группы, или кластеры. Их смысл интерпретируют после группировки."}]}, {"name": "Робот-доставщик", "title": "Помогите роботу доставлять посылки", "story": "Робот выбирает действия на улицах и пробует разные маршруты. Правильный маршрут ему не показывают.", "clue": "Доставка: +10. Столкновение: −5. Обычный шаг: −1. Оценка приходит после действия.", "groups": [{"title": "1. Выберите вид обучения", "options": ["С учителем", "Без учителя", "С подкреплением"], "correct": 2, "explanation": "С подкреплением: агент действует в среде и учится на последствиях своих действий."}, {"title": "2. Что даёт обратную связь?", "options": ["Готовый правильный поворот в каждой точке", "Награда или штраф после действия", "Похожие по цвету здания"], "correct": 1, "explanation": "Обратная связь — награда и штраф от среды. Они оценивают последствия, но не сообщают весь маршрут."}]}, {"name": "Новые метки", "title": "Условие изменилось. Измените метод", "story": "В задаче о пассажирах специалисты теперь заранее присвоили категории обучающим примерам. Нужно предсказывать категорию нового пассажира.", "clue": "Раньше готовых групп не было. Теперь для обучения есть известные категории, которые требуется предсказывать.", "groups": [{"title": "1. Какой метод нужен теперь?", "options": ["С подкреплением", "С учителем", "Без учителя"], "correct": 1, "explanation": "Теперь подходит обучение с учителем: нужно предсказывать заранее определённую категорию по размеченным примерам."}, {"title": "2. Почему метод изменился?", "options": ["Появились правильные ответы для обучения", "Стало больше пассажиров", "Компьютер стал работать быстрее"], "correct": 0, "explanation": "Причина — появление целевых меток и задачи их предсказания. Количество пассажиров и скорость компьютера сами по себе не определяют метод."}]}, {"name": "Настройка награды", "title": "Не дайте роботу ездить бесконечно", "story": "Робот должен доставлять посылку коротким безопасным путём. Вы задаёте награду и формулируете цель обучения.", "clue": "Если награждать каждый шаг, агенту может быть выгодно ездить кругами. Поощряйте результат, которого действительно хотите.", "groups": [{"title": "1. Как настроить награду?", "options": ["+1 за каждый шаг, 0 за доставку", "+10 за столкновение, −5 за доставку", "+10 за доставку, −1 за шаг, −5 за столкновение"], "correct": 2, "explanation": "Такая награда поощряет доставку, а лишние шаги и столкновения уменьшают итог."}, {"title": "2. К чему должен стремиться агент?", "options": ["Совершить как можно больше шагов", "Получить больше суммарной награды", "Повторять самое первое действие"], "correct": 1, "explanation": "Цель — максимизировать суммарную награду. Ради будущих +10 иногда стоит сделать обычный шаг с −1."}]}];

let cityMissionIndex=0;
const cityState=cityMissions.map(()=>({choices:[null,null],checked:false,points:0}));
const cityStations=[...document.querySelectorAll('[data-mission]')];
function updateCityTotals(){
 const finished=cityState.filter(x=>x.checked).length,total=cityState.reduce((sum,x)=>sum+x.points,0);
 document.getElementById('cityProgress').textContent='Проверено: '+finished+' из 5';document.getElementById('cityScore').textContent='Баллы: '+total+' / 10';
 cityStations.forEach((button,i)=>{const state=cityState[i];button.setAttribute('aria-pressed',String(i===cityMissionIndex));button.classList.toggle('done',state.checked&&state.points===2);button.classList.toggle('revise',state.checked&&state.points<2);button.querySelector('.station-result').textContent=state.checked?state.points+' / 2':(i+1)+' / 5'});
 const complete=document.getElementById('cityFinish');complete.hidden=finished!==5;complete.textContent=total===10?'Все пять объектов настроены верно! Ваш результат: 10 / 10. Объясните, почему для разных задач понадобились разные методы.':'Все пять объектов проверены. Результат: '+total+' / 10. Откройте объекты с оранжевыми значками, разберите пояснения и при желании начните новую попытку.';
 document.getElementById('cityReportScore').textContent=total+' / 10';document.getElementById('cityReportText').textContent=finished===5?(total===10?'Все решения верны. Теперь объясните свой выбор.':'Прочитайте пояснения к ошибкам в задании и объясните, что нужно изменить.'):'Проверено '+finished+' из 5 объектов. Завершите задание на предыдущем слайде.';document.getElementById('cityReportBar').style.width=total*10+'%';
}
function renderCityMission(){
 const mission=cityMissions[cityMissionIndex],state=cityState[cityMissionIndex];
 document.getElementById('missionBadge').textContent='Объект '+(cityMissionIndex+1)+' / 5 · '+mission.name;document.getElementById('missionTitle').textContent=mission.title;document.getElementById('missionStory').textContent=mission.story;document.getElementById('missionClue').textContent=mission.clue;document.getElementById('missionPoints').textContent=state.checked?'Получено: '+state.points+' / 2':'Можно получить 2 балла';
 mission.groups.forEach((group,groupIndex)=>{
  document.getElementById('configTitle'+groupIndex).textContent=group.title;
  const options=document.getElementById('configOptions'+groupIndex);options.replaceChildren();
  group.options.forEach((label,optionIndex)=>{
   const button=document.createElement('button');button.type='button';button.className='config-choice';button.dataset.group=groupIndex;button.dataset.option=optionIndex;button.setAttribute('aria-pressed',String(state.choices[groupIndex]===optionIndex));button.disabled=state.checked;
   const letter=document.createElement('span'),text=document.createElement('span');letter.textContent=String.fromCharCode(1040+optionIndex);text.textContent=label;button.append(letter,text);
   if(state.checked){button.classList.toggle('is-correct',optionIndex===group.correct);button.classList.toggle('is-wrong',state.choices[groupIndex]===optionIndex&&optionIndex!==group.correct)}
   button.onclick=()=>{if(state.checked)return;state.choices[groupIndex]=optionIndex;options.querySelectorAll('button').forEach((item,i)=>item.setAttribute('aria-pressed',String(i===optionIndex)));document.getElementById('cityCheck').disabled=state.choices.includes(null);document.getElementById('missionActionHint').textContent=state.choices.includes(null)?'Осталось выбрать решение в другой группе.':'Оба решения выбраны. Проверьте настройку.'};options.appendChild(button);
  });
 });
 const check=document.getElementById('cityCheck');check.disabled=state.checked||state.choices.includes(null);check.textContent=state.checked?'Настройка проверена':'Проверить настройку';document.getElementById('missionActionHint').textContent=state.checked?'Ответ зафиксирован. Пояснения — ниже.':state.choices.includes(null)?'Выберите по одному варианту в каждой группе.':'Оба решения выбраны. Проверьте настройку.';
 const remaining=cityState.some(x=>!x.checked);document.getElementById('cityNext').hidden=!state.checked||!remaining;
 const result=document.getElementById('missionResult');result.hidden=!state.checked;result.className='mission-result'+(state.points<2?' revise':'');result.replaceChildren();
 if(state.checked){const title=document.createElement('strong');title.textContent=state.points===2?'Объект настроен верно · 2 / 2':'Есть что исправить · '+state.points+' / 2';result.appendChild(title);mission.groups.forEach((group,i)=>{const paragraph=document.createElement('p');paragraph.textContent=(state.choices[i]===group.correct?'✓ Верно. ':'↺ Проверьте решение. ')+group.explanation;result.appendChild(paragraph)})}
 updateCityTotals();
}
cityStations.forEach(button=>button.onclick=()=>{cityMissionIndex=Number(button.dataset.mission);renderCityMission()});
document.getElementById('cityCheck').onclick=()=>{const state=cityState[cityMissionIndex];if(state.checked||state.choices.includes(null))return;state.points=cityMissions[cityMissionIndex].groups.reduce((score,group,i)=>score+Number(state.choices[i]===group.correct),0);state.checked=true;renderCityMission();document.getElementById('missionResult').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
document.getElementById('cityNext').onclick=()=>{for(let step=1;step<=cityState.length;step++){const index=(cityMissionIndex+step)%cityState.length;if(!cityState[index].checked){cityMissionIndex=index;renderCityMission();document.querySelector('.city-mission').scrollIntoView({block:'start',behavior:'instant'});return}}};
document.getElementById('cityReset').onclick=()=>{cityState.forEach(state=>{state.choices=[null,null];state.checked=false;state.points=0});cityMissionIndex=0;renderCityMission()};
renderCityMission();

// A small evolutionary controller: distance around the track selects the next generation.
const raceWorld=(()=>{
 const surface=document.getElementById('raceCanvas'),pen=surface.getContext('2d');
 const SIZE=560,CX=280,CY=265,RADIUS=166,HALF=26,COUNT=100,ROUND=9;
 let seed=41,generation=1,elapsed=0,cars=[],lastTime=null,lastUi=-1,previousFinished=0;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 function gaussian(){return Math.sqrt(-2*Math.log(Math.max(random(),1e-9)))*Math.cos(2*Math.PI*random())}
 function wrap(angle){while(angle>Math.PI)angle-=Math.PI*2;while(angle<-Math.PI)angle+=Math.PI*2;return angle}
 function spawn(genes){cars=genes.map((weights,i)=>{const angle=-Math.PI/2+Math.floor(i/5)*.022,r=RADIUS+(i%5-2)*7;return {weights,x:CX+Math.cos(angle)*r,y:CY+Math.sin(angle)*r,heading:angle+Math.PI/2,speed:150+(i%7)*4,progress:0,fitness:0,alive:true,lap:false,trail:[],color:['#ede3ff','#c2a6ff','#8d6aff','#a0f0d4','#ffd2ad'][i%5]}});elapsed=0;lastUi=-1}
 spawn(Array.from({length:COUNT},()=>[-3+random()*8,-6+random()*12,-7+random()*14]));
 function newGeneration(){
  previousFinished=cars.filter(car=>car.lap).length;
  const ranked=[...cars].sort((a,b)=>b.fitness-a.fitness),parents=ranked.slice(0,12),genes=parents.slice(0,5).map(car=>[...car.weights]);
  const mutation=Math.max(.09,1.8*Math.pow(.8,generation-1));
  while(genes.length<COUNT){const parent=parents[Math.floor(random()*parents.length)];genes.push(parent.weights.map(w=>Math.max(-10,Math.min(10,w+gaussian()*mutation))))}
  generation++;spawn(genes);
 }
 function step(dt){
  elapsed+=dt;
  for(const car of cars){
   if(!car.alive)continue;
   const dx=car.x-CX,dy=car.y-CY,angle=Math.atan2(dy,dx),r=Math.hypot(dx,dy),headingError=wrap(angle+Math.PI/2-car.heading);
   const turn=Math.max(-4,Math.min(4,car.speed/RADIUS*car.weights[0]+car.weights[1]*headingError+car.weights[2]*(r-RADIUS)/HALF));
   car.heading+=turn*dt;car.x+=Math.cos(car.heading)*car.speed*dt;car.y+=Math.sin(car.heading)*car.speed*dt;
   car.progress+=wrap(Math.atan2(car.y-CY,car.x-CX)-angle);car.fitness=Math.max(car.fitness,car.progress);
   if(Math.abs(Math.hypot(car.x-CX,car.y-CY)-RADIUS)>HALF-3){car.alive=false}else if(car.progress>=Math.PI*2){car.lap=true}
   if(car.trail.length===8)car.trail.shift();car.trail.push([car.x,car.y]);
  }
  if(elapsed>=ROUND||cars.every(car=>!car.alive))newGeneration();
 }
 function circle(radius,fill,stroke,width){pen.beginPath();pen.arc(CX,CY,radius,0,Math.PI*2);if(fill){pen.fillStyle=fill;pen.fill()}if(stroke){pen.strokeStyle=stroke;pen.lineWidth=width;pen.stroke()}}
 function draw(){
  pen.clearRect(0,0,SIZE,SIZE);
  circle(RADIUS+41,'#e7def4');circle(RADIUS+31,null,'#fff',2);
  circle(RADIUS,null,'#443653',HALF*2+5);
  pen.setLineDash([9,8]);circle(RADIUS+HALF+1,null,'#c9b1ff',5);circle(RADIUS-HALF-1,null,'#c9b1ff',5);pen.setLineDash([]);
  pen.setLineDash([8,14]);circle(RADIUS,null,'#ffffff42',1.5);pen.setLineDash([]);
  circle(RADIUS-HALF-7,'#f4f0fc');circle(RADIUS-HALF-17,null,'#fff',1.5);
  for(let row=0;row<12;row++)for(let col=0;col<3;col++){pen.fillStyle=(row+col)%2?'#efe7ff':'#645371';pen.fillRect(CX-6+col*4,CY-RADIUS-HALF+row*4.3,4,4.3)}
  pen.fillStyle='#aa95c0';pen.font='700 11px Segoe UI, Arial';pen.textAlign='center';pen.fillText('УЧЕБНЫЙ ЗАЕЗД',CX,CY-40);
  pen.fillStyle='#7c4dff';pen.font='800 56px Segoe UI, Arial';pen.fillText('100',CX,CY+15);
  pen.fillStyle='#65557b';pen.font='500 13px Segoe UI, Arial';pen.fillText('машин в поколении',CX,CY+41);
  for(const car of cars){
   if(car.alive&&car.trail.length>1){pen.strokeStyle=car.color+'30';pen.lineWidth=2;pen.beginPath();car.trail.forEach(([x,y],i)=>i?pen.lineTo(x,y):pen.moveTo(x,y));pen.stroke()}
   pen.save();pen.translate(car.x,car.y);pen.rotate(car.heading);pen.globalAlpha=car.alive ? .95 : .24;pen.fillStyle=car.alive?car.color:'#ff9e68';pen.fillRect(-6,-3,12,6);pen.fillStyle=car.alive?'#2e2040':'#6c3e31';pen.fillRect(0,-2,3,4);pen.fillStyle='#fff';pen.fillRect(4,-2.5,1.5,1.2);pen.fillRect(4,1.3,1.5,1.2);pen.restore();
  }
  pen.fillStyle='#8d7db0';pen.font='600 11px Segoe UI, Arial';pen.textAlign='center';pen.fillText('СТАРТ / ФИНИШ',CX,CY-RADIUS-HALF-17);
 }
 function updateStats(){document.getElementById('raceGeneration').textContent=String(generation).padStart(2,'0');document.getElementById('raceAlive').textContent=cars.filter(car=>car.alive).length;document.getElementById('raceFinished').textContent=cars.filter(car=>car.lap).length+' / 100';document.getElementById('raceStatus').textContent=generation===1?'Первый заезд':'В прошлом заезде: '+previousFinished+' прошли круг'}
 function resize(){const width=Math.max(1,surface.getBoundingClientRect().width),ratio=Math.min(devicePixelRatio||1,2);surface.width=Math.round(width*ratio);surface.height=surface.width;pen.setTransform(surface.width/SIZE,0,0,surface.height/SIZE,0,0);draw()}
 function animate(time){
  const active=!document.hidden&&surface.closest('.slide').classList.contains('active');
  if(active){let dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);while(dt>0){const slice=Math.min(dt,1/60);step(slice);dt-=slice}draw();if(time-lastUi>150||lastUi<0){updateStats();lastUi=time}}
  lastTime=active?time:null;requestAnimationFrame(animate);
 }
 new ResizeObserver(resize).observe(surface);resize();updateStats();requestAnimationFrame(animate);
 return {step,draw,updateStats,get generation(){return generation},get cars(){return cars},get elapsed(){return elapsed},get previousFinished(){return previousFinished}};
})();
  };

  /* Lesson 10emn-9 (10 ЕМН - 9 урок) */
  LESSON_SCRIPTS['10emn-9'] = function() {
'use strict';

    const slides = [...document.querySelectorAll('.slide')];
    const dotsNav = document.getElementById('dotsNav');
    const progress = document.getElementById('progress');
    const counter = document.getElementById('counter');
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');
    const modelForm = document.getElementById('model-form');
    const modelStatus = document.getElementById('model-status');
    const cameraStatus = document.getElementById('camera-status');
    const downloadSlideButton = document.getElementById('download-slide');
    const loadModelButton = document.getElementById('load-model');
    const cameraButton = document.getElementById('camera-button');
    const stopButton = document.getElementById('stop-button');
    const webcamContainer = document.getElementById('webcam-container');
    const threshold = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const predictionLabel = document.getElementById('prediction-label');
    const actionLabel = document.getElementById('action-label');
    const confidence = document.getElementById('confidence');
    const confidenceMeter = document.getElementById('confidence-meter');
    const confidenceProgress = document.querySelector('.meter[role="progressbar"]');
    const audioPlayer = document.getElementById('audio-player');
    const audioStatus = document.getElementById('audio-status');
    const volumeControl = document.getElementById('volume-control');
    const volumeValue = document.getElementById('volume-value');
    const audioFile = document.getElementById('audio-file');
    const dinoModelForm = document.getElementById('dino-model-form');
    const dinoModelStatus = document.getElementById('dino-model-status');
    const dinoLoadModelButton = document.getElementById('dino-load-model');
    const dinoCameraButton = document.getElementById('dino-camera-button');
    const dinoStopCameraButton = document.getElementById('dino-stop-camera');
    const dinoWebcamContainer = document.getElementById('dino-webcam-container');
    const dinoThreshold = document.getElementById('dino-threshold');
    const dinoThresholdValue = document.getElementById('dino-threshold-value');
    const dinoPredictionLabel = document.getElementById('dino-prediction-label');
    const dinoActionLabel = document.getElementById('dino-action-label');
    const dinoConfidence = document.getElementById('dino-confidence');
    const dinoGameCanvas = document.getElementById('dino-game');
    const dinoGameContext = dinoGameCanvas.getContext('2d');
    const dinoGameStatus = document.getElementById('dino-game-status');
    const dinoScoreOutput = document.getElementById('dino-score');
    const downloadDinoSlideButton = document.getElementById('download-dino-slide');
    const mappingSelects = {
      up: document.getElementById('map-up'),
      down: document.getElementById('map-down'),
      play: document.getElementById('map-play'),
      pause: document.getElementById('map-pause'),
      forward: document.getElementById('map-forward'),
      back: document.getElementById('map-back'),
      neutral: document.getElementById('map-neutral')
    };
    const dinoMappingSelects = {
      start: document.getElementById('dino-map-start'),
      stop: document.getElementById('dino-map-stop'),
      jump: document.getElementById('dino-map-jump'),
      duck: document.getElementById('dino-map-duck'),
      neutral: document.getElementById('dino-map-neutral')
    };

    let currentSlide = 0;
    let model = null;
    let cameraStream = null;
    let cameraVideo = null;
    let cameraStartPending = false;
    let cameraRequestId = 0;
    let inferenceRunning = false;
    let lastActionClass = null;
    let currentAudioUrl = null;
    let dinoModel = null;
    let dinoCameraStream = null;
    let dinoCameraVideo = null;
    let dinoCameraStartPending = false;
    let dinoCameraRequestId = 0;
    let dinoInferenceRunning = false;
    let lastDinoActionClass = null;
    let dinoAnimationFrame = null;
    let dinoLastFrame = 0;
    let dinoGameState = 'ready';
    let dinoScore = 0;
    let dinoObstacleX = dinoGameCanvas.width - 70;
    let dinoJumpUntil = 0;
    let dinoDuckUntil = 0;
    const defaultAudioUrl = audioPlayer.getAttribute('src');

    function setStatus(element, message, kind) {
      element.textContent = message;
      element.dataset.kind = kind || '';
    }

    function isCameraAllowedByFramePolicy() {
      const policy = document.permissionsPolicy || document.featurePolicy;
      return !policy || typeof policy.allowsFeature !== 'function' || policy.allowsFeature('camera');
    }

    function downloadAndOpenSlide(slideNumber) {
      const isDinoSlide = slideNumber === 5;
      const exportStatus = isDinoSlide ? document.getElementById('dino-camera-status') : cameraStatus;
      const exportMappingSelects = isDinoSlide ? dinoMappingSelects : mappingSelects;
      let standaloneWindow = null;
      let openError = '';
      try {
        standaloneWindow = window.open('about:blank', '_blank');
      } catch (error) {
        openError = error instanceof Error ? error.message : String(error);
      }
      const exportedDocument = document.documentElement.cloneNode(true);
      exportedDocument.querySelector('title').textContent = isDinoSlide
        ? 'Игра Динозаврик под управлением жестами · Урок 5'
        : 'AI-панель управления жестами · Урок 5';
      const modelUrlSelector = isDinoSlide ? '#dino-model-url' : '#model-url';
      const modelUrlInput = exportedDocument.querySelector(modelUrlSelector);
      modelUrlInput.setAttribute('value', document.querySelector(modelUrlSelector).value);

      const exportedMappingSelector = isDinoSlide ? '.dino-layout .mapping-grid select' : '.panel-content .mapping-grid select';
      exportedDocument.querySelectorAll(exportedMappingSelector).forEach((select, index) => {
        const selectedValue = Object.values(exportMappingSelects)[index].value;
        [...select.options].forEach(option => {
          if (option.value === selectedValue) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        });
      });

      const exportStyles = document.createElement('style');
      exportStyles.textContent = `
        body { height: auto; min-height: 100vh; overflow: auto; }
        .slide:not(:nth-of-type(${slideNumber})) { display: none !important; }
        main > .slide:nth-of-type(${slideNumber}) {
          position: relative; display: flex !important; min-height: 100vh;
          overflow: visible; padding-bottom: 38px;
        }
        #network-bg { position: fixed; }
        .progress-bar, .dots-nav, .nav-controls { display: none !important; }
      `;
      exportedDocument.querySelector('head').append(exportStyles);

      const exportedHtml = `<!DOCTYPE html>\n${exportedDocument.outerHTML.replace(
        /const match = \/\^#\(\[1-6\]\)\$\/\.exec\(location\.hash\);\s*setSlide\(match \? Number\(match\[1\]\) - 1 : 0\);/,
        `const match = /^#([1-6])$/.exec(location.hash); setSlide(match ? Number(match[1]) - 1 : ${slideNumber - 1});`
      )}`;
      const fileUrl = URL.createObjectURL(new Blob([exportedHtml], { type: 'text/html;charset=utf-8' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = isDinoSlide ? 'Урок 5 - слайд 5.html' : 'Урок 5 - слайд 3.html';
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
      if (standaloneWindow) {
        try {
          standaloneWindow.location.href = fileUrl;
          setStatus(exportStatus, `Слайд ${slideNumber} скачан и открыт отдельно. Разрешите камеру в новой вкладке.`, 'success');
        } catch (error) {
          setStatus(exportStatus, `Файл скачан, но браузер не открыл новую вкладку: ${error instanceof Error ? error.message : String(error)}. Откройте файл из загрузок.`, 'error');
        }
      } else {
        const reason = openError ? ` (${openError})` : '';
        const fileName = isDinoSlide ? 'Урок 5 - слайд 5.html' : 'Урок 5 - слайд 3.html';
        setStatus(exportStatus, `Слайд скачан${reason}. Откройте файл «${fileName}» из загрузок браузера.`, 'success');
      }
    }

    function setSlide(index) {
      if (index < 0 || index >= slides.length) return;
      if (currentSlide !== index) {
        if (inferenceRunning || cameraStartPending) stopCamera();
        if (dinoInferenceRunning || dinoCameraStartPending) stopDinoCamera();
        if (currentSlide === 4 && dinoGameState === 'running') pauseDinoGame();
      }
      currentSlide = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === currentSlide);
        slide.setAttribute('aria-hidden', String(slideIndex !== currentSlide));
        slide.querySelectorAll('video').forEach(video => {
          if (slideIndex === currentSlide) video.play().catch(() => {});
          else video.pause();
        });
      });
      [...dotsNav.children].forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === currentSlide);
        if (dotIndex === currentSlide) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      counter.textContent = `${currentSlide + 1} / ${slides.length}`;
      progress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
      prevButton.disabled = currentSlide === 0;
      nextButton.disabled = currentSlide === slides.length - 1;
      slides[currentSlide].scrollTop = 0;
      history.replaceState(null, '', `#${currentSlide + 1}`);
    }

    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot-nav dot';
      const title = slides[index].querySelector('h1, h2').textContent.trim();
      dot.title = `Слайд ${index + 1}: ${title}`;
      dot.setAttribute('aria-label', dot.title);
      dot.addEventListener('click', () => setSlide(index));
      dotsNav.append(dot);
    });

    document.getElementById('startBtn').addEventListener('click', () => setSlide(1));
    prevButton.addEventListener('click', () => setSlide(currentSlide - 1));
    nextButton.addEventListener('click', () => setSlide(currentSlide + 1));

    function goToHash() {
      const match = /^#([1-6])$/.exec(location.hash);
      setSlide(match ? Number(match[1]) - 1 : 0);
    }

    window.addEventListener('hashchange', goToHash);

    document.addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, select, button, a, summary, video, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return;
      const destinations = {
        ArrowRight: currentSlide + 1,
        PageDown: currentSlide + 1,
        ArrowLeft: currentSlide - 1,
        PageUp: currentSlide - 1,
        ' ': currentSlide + 1,
        Home: 0,
        End: slides.length - 1
      };
      if (Object.hasOwn(destinations, event.key)) {
        event.preventDefault();
        setSlide(destinations[event.key]);
      }
      if (event.key.toLowerCase() === 'f') {
        document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
      }
    });

    const canvas = document.getElementById('network-bg');
    const ctx = canvas.getContext('2d');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let particles = [];
    let animationFrame = null;

    function initParticles() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      particles = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - .5) * .9,
        vy: (Math.random() - .5) * .9,
        radius: Math.random() * 1.5 + 1
      }));
      drawBackground(false);
    }

    function drawBackground(move) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle, index) => {
        if (move) {
          const motionScale = reducedMotion.matches ? .35 : 1;
          particle.x += particle.vx * motionScale;
          particle.y += particle.vy * motionScale;
          if (particle.x < -30) particle.x = canvas.width + 30;
          if (particle.x > canvas.width + 30) particle.x = -30;
          if (particle.y < -30) particle.y = canvas.height + 30;
          if (particle.y > canvas.height + 30) particle.y = -30;
        }
        particles.slice(index + 1).forEach(other => {
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < 190) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${.12 * (1 - distance / 190)})`;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
        ctx.fillStyle = 'rgba(244, 63, 94, .2)';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function animate() {
      animationFrame = null;
      if (document.hidden) return;
      drawBackground(true);
      animationFrame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (!document.hidden) animate();
      else drawBackground(false);
    }

    window.addEventListener('resize', initParticles);
    document.addEventListener('visibilitychange', updateAnimation);
    reducedMotion.addEventListener('change', updateAnimation);

    function updateThreshold() {
      const value = Number(threshold.value);
      thresholdValue.value = `${value}%`;
      thresholdValue.textContent = `${value}%`;
    }

    function updateVolume() {
      const value = Number(volumeControl.value);
      audioPlayer.volume = value / 100;
      volumeValue.value = `${value}%`;
      volumeValue.textContent = `${value}%`;
    }

    function setPrediction(label, score) {
      const percentage = Math.round(score * 100);
      predictionLabel.textContent = label;
      confidence.textContent = `${percentage}%`;
      confidenceMeter.style.width = `${percentage}%`;
      confidenceProgress.setAttribute('aria-valuenow', String(percentage));
    }

    function guessLabel(labels, words) {
      return labels.find(label => words.some(word => label.toLocaleLowerCase('ru').includes(word))) || '';
    }

    function fillMappingOptions(labels) {
      const defaults = {
        up: guessLabel(labels, ['громкость +', 'громкость плюс', 'увелич', 'volume up', 'volume plus']),
        down: guessLabel(labels, ['громкость −', 'громкость -', 'громкость минус', 'уменьш', 'volume down', 'volume minus']),
        play: guessLabel(labels, ['пуск', 'старт', 'воспроизвести', 'play', 'start']),
        pause: guessLabel(labels, ['пауза', 'pause', 'stop']),
        forward: guessLabel(labels, ['вперёд', 'вперед', 'след', 'перемотка впер', 'forward', 'next']),
        back: guessLabel(labels, ['назад', 'предыдущ', 'перемотка назад', 'back', 'previous']),
        neutral: guessLabel(labels, ['нейтр', 'ничего', 'nothing', 'neutral'])
      };
      Object.entries(mappingSelects).forEach(([key, select]) => {
        select.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Выберите класс';
        select.append(placeholder);
        labels.forEach(label => {
          const option = document.createElement('option');
          option.value = label;
          option.textContent = label;
          select.append(option);
        });
        select.disabled = false;
        select.value = defaults[key];
      });
      threshold.disabled = false;
    }

    function readModelBaseUrl(rawValue) {
      let url;
      try {
        url = new URL(rawValue.trim());
      } catch {
        throw new Error('Введите корректный URL опубликованной модели.');
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Адрес модели должен начинаться с http:// или https://.');
      }
      if (url.pathname.endsWith('model.json')) {
        url.pathname = url.pathname.slice(0, -'model.json'.length);
      }
      if (!url.pathname.endsWith('/')) url.pathname += '/';
      url.search = '';
      url.hash = '';
      return url.href;
    }

    function addCacheBuster(url, value) {
      const cacheBustedUrl = new URL(url);
      cacheBustedUrl.searchParams.set('_lesson_refresh', value);
      return cacheBustedUrl.href;
    }

    function guessDinoLabel(labels, words) {
      return labels.find(label => words.some(word => label.toLocaleLowerCase('ru').includes(word))) || '';
    }

    function fillDinoMappingOptions(labels) {
      const defaults = {
        start: guessDinoLabel(labels, ['старт', 'начать', 'пуск', 'start', 'play']),
        stop: guessDinoLabel(labels, ['стоп', 'пауза', 'останов', 'stop', 'pause']),
        jump: guessDinoLabel(labels, ['прыж', 'jump']),
        duck: guessDinoLabel(labels, ['нагнуться', 'нагиб', 'наклон', 'присесть', 'duck', 'crouch']),
        neutral: guessDinoLabel(labels, ['нейтр', 'ничего', 'neutral', 'nothing'])
      };
      Object.entries(dinoMappingSelects).forEach(([key, select]) => {
        select.replaceChildren(new Option('Выберите класс', ''));
        labels.forEach(label => select.append(new Option(label, label)));
        select.disabled = false;
        select.value = defaults[key];
      });
      dinoThreshold.disabled = false;
    }

    function updateDinoThreshold() {
      const value = Number(dinoThreshold.value);
      dinoThresholdValue.value = `${value}%`;
      dinoThresholdValue.textContent = `${value}%`;
    }

    function setDinoPrediction(label, score) {
      dinoPredictionLabel.textContent = label;
      dinoConfidence.textContent = `${Math.round(score * 100)}%`;
    }

    function drawDinoScene() {
      const { width, height } = dinoGameCanvas;
      const groundY = height - 34;
      const now = performance.now();
      const ducking = now < dinoDuckUntil;
      const jumping = now < dinoJumpUntil;
      const playerX = 76;
      const playerHeight = ducking ? 25 : 52;
      const playerY = groundY - playerHeight - (jumping ? 58 : 0);

      dinoGameContext.clearRect(0, 0, width, height);
      dinoGameContext.fillStyle = '#f8fafc';
      dinoGameContext.fillRect(0, 0, width, height);
      dinoGameContext.fillStyle = '#e2e8f0';
      dinoGameContext.beginPath();
      dinoGameContext.arc(width - 96, 48, 23, 0, Math.PI * 2);
      dinoGameContext.fill();
      dinoGameContext.strokeStyle = '#64748b';
      dinoGameContext.lineWidth = 3;
      dinoGameContext.beginPath();
      dinoGameContext.moveTo(0, groundY);
      dinoGameContext.lineTo(width, groundY);
      dinoGameContext.stroke();
      dinoGameContext.fillStyle = '#334155';
      dinoGameContext.fillRect(playerX + (ducking ? 5 : 8), playerY, ducking ? 43 : 35, playerHeight);
      dinoGameContext.fillRect(playerX + (ducking ? 30 : 26), playerY - (ducking ? 1 : 12), 18, ducking ? 16 : 20);
      dinoGameContext.fillStyle = '#f8fafc';
      dinoGameContext.fillRect(playerX + 37, playerY - (ducking ? -3 : 5), 4, 4);
      dinoGameContext.fillStyle = '#15803d';
      dinoGameContext.fillRect(dinoObstacleX, groundY - 38, 13, 38);
      dinoGameContext.fillRect(dinoObstacleX - 6, groundY - 25, 9, 6);
      dinoGameContext.fillRect(dinoObstacleX + 10, groundY - 32, 9, 6);
    }

    function finishDinoGame() {
      dinoGameState = 'over';
      dinoGameStatus.textContent = 'Столкновение! Покажите «старт» или нажмите кнопку, чтобы сыграть ещё.';
      dinoAnimationFrame = null;
      drawDinoScene();
    }

    function runDinoGameFrame(timestamp) {
      if (dinoGameState !== 'running') {
        dinoAnimationFrame = null;
        return;
      }
      const elapsed = Math.min((timestamp - dinoLastFrame) / 1000, .05);
      dinoLastFrame = timestamp;
      dinoObstacleX -= 300 * elapsed;
      if (dinoObstacleX < -24) {
        dinoObstacleX = dinoGameCanvas.width + 80 + Math.random() * 180;
        dinoScore += 10;
        dinoScoreOutput.value = String(dinoScore);
        dinoScoreOutput.textContent = String(dinoScore);
      }
      const playerRight = 76 + (timestamp < dinoDuckUntil ? 53 : 43);
      if (dinoObstacleX < playerRight && dinoObstacleX + 20 > 76
        && timestamp >= dinoJumpUntil && timestamp >= dinoDuckUntil) {
        finishDinoGame();
        return;
      }
      drawDinoScene();
      dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
    }

    function startDinoGame(restart = false) {
      if (dinoGameState === 'paused' && !restart) {
        dinoGameState = 'running';
        dinoGameStatus.textContent = 'Игра продолжается — перепрыгивайте или пригибайтесь перед препятствиями.';
        dinoLastFrame = performance.now();
        dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
        return;
      }
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
      dinoAnimationFrame = null;
      dinoScore = 0;
      dinoScoreOutput.value = '0';
      dinoScoreOutput.textContent = '0';
      dinoObstacleX = dinoGameCanvas.width - 70;
      dinoJumpUntil = 0;
      dinoDuckUntil = 0;
      dinoGameState = 'running';
      dinoGameStatus.textContent = 'Игра идёт — перепрыгивайте или пригибайтесь перед препятствиями.';
      dinoLastFrame = performance.now();
      drawDinoScene();
      dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
    }

    function pauseDinoGame() {
      if (dinoGameState !== 'running') return;
      dinoGameState = 'paused';
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
      dinoAnimationFrame = null;
      dinoGameStatus.textContent = 'Игра на паузе. Покажите «старт», чтобы продолжить.';
      drawDinoScene();
    }

    function jumpDino() {
      if (dinoGameState !== 'running') {
        dinoGameStatus.textContent = 'Сначала запустите игру жестом «старт» или кнопкой.';
        return;
      }
      dinoJumpUntil = performance.now() + 680;
      dinoDuckUntil = 0;
      dinoGameStatus.textContent = 'Прыжок!';
    }

    function duckDino() {
      if (dinoGameState !== 'running') {
        dinoGameStatus.textContent = 'Сначала запустите игру жестом «старт» или кнопкой.';
        return;
      }
      dinoDuckUntil = performance.now() + 720;
      dinoJumpUntil = 0;
      dinoGameStatus.textContent = 'Динозаврик пригнулся.';
    }

    function runDinoAction(action) {
      if (action === 'start') {
        startDinoGame();
        dinoActionLabel.textContent = 'Игра запущена или перезапущена';
      } else if (action === 'stop') {
        pauseDinoGame();
        dinoActionLabel.textContent = 'Игра приостановлена';
      } else if (action === 'jump') {
        jumpDino();
        dinoActionLabel.textContent = 'Команда: прыжок';
      } else if (action === 'duck') {
        duckDino();
        dinoActionLabel.textContent = 'Команда: нагнуться';
      }
    }

    async function loadDinoModel(event) {
      event.preventDefault();
      if (!window.tmImage || !window.tf) {
        setStatus(dinoModelStatus, 'Не удалось загрузить библиотеки модели. Проверьте подключение к интернету и обновите страницу.', 'error');
        return;
      }
      if (dinoInferenceRunning || dinoCameraStartPending) stopDinoCamera();
      dinoModel = null;
      let loadedTensorflowModel = null;
      dinoLoadModelButton.disabled = true;
      dinoCameraButton.disabled = true;
      Object.values(dinoMappingSelects).forEach(select => {
        select.disabled = true;
        select.replaceChildren(new Option('Загрузка модели…', ''));
      });
      dinoThreshold.disabled = true;
      setStatus(dinoModelStatus, 'Загружаю модель…', 'working');
      try {
        const baseUrl = readModelBaseUrl(document.getElementById('dino-model-url').value);
        const refreshKey = `${Date.now()}-${crypto.randomUUID()}`;
        const [tensorflowModel, metadataResponse] = await Promise.all([
          window.tf.loadLayersModel(addCacheBuster(`${baseUrl}model.json`, refreshKey), { requestInit: { cache: 'no-store' } }),
          fetch(addCacheBuster(`${baseUrl}metadata.json`, refreshKey), { cache: 'no-store' })
        ]);
        loadedTensorflowModel = tensorflowModel;
        if (!metadataResponse.ok) throw new Error(`Не удалось загрузить metadata.json (HTTP ${metadataResponse.status}).`);
        const metadata = await metadataResponse.json();
        const labels = metadata.labels;
        if (!Array.isArray(labels) || !labels.every(label => typeof label === 'string')) {
          throw new Error('В metadata.json отсутствует список названий классов.');
        }
        if (!labels.length) throw new Error('В опубликованной модели не найдены классы.');
        const outputCount = tensorflowModel.outputs[0]?.shape[1];
        if (outputCount !== labels.length) {
          throw new Error(`Модель выдаёт ${outputCount ?? 'неизвестное число'} классов, а metadata.json содержит ${labels.length}. Опубликуйте модель заново в Teachable Machine и подключите новую ссылку.`);
        }
        dinoModel = new window.tmImage.CustomMobileNet(tensorflowModel, metadata);
        loadedTensorflowModel = null;
        fillDinoMappingOptions(labels);
        lastDinoActionClass = null;
        dinoCameraButton.disabled = false;
        setStatus(dinoModelStatus, `Модель подключена · классов: ${labels.length}. Назначьте команды и запустите камеру.`, 'success');
      } catch (error) {
        if (loadedTensorflowModel) loadedTensorflowModel.dispose();
        dinoModel = null;
        Object.values(dinoMappingSelects).forEach(select => {
          select.disabled = true;
          select.replaceChildren(new Option('Не удалось загрузить модель', ''));
        });
        dinoThreshold.disabled = true;
        setStatus(dinoModelStatus, `Не удалось загрузить модель: ${error instanceof Error ? error.message : String(error)}`, 'error');
      } finally {
        dinoLoadModelButton.disabled = false;
      }
    }

    async function startDinoCamera() {
      if (!dinoModel) {
        setStatus(document.getElementById('dino-camera-status'), 'Сначала подключите модель.', 'error');
        return;
      }
      if (!isCameraAllowedByFramePolicy()) {
        setStatus(document.getElementById('dino-camera-status'), 'Встроенная страница блокирует камеру. Скачайте слайд 5, откройте его отдельно и разрешите камеру.', 'error');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(document.getElementById('dino-camera-status'), 'Для камеры нужен HTTPS или localhost. Если урок встроен в сайт, скачайте слайд 5 и откройте его отдельно.', 'error');
        return;
      }
      dinoCameraButton.disabled = true;
      dinoCameraStartPending = true;
      const requestId = ++dinoCameraRequestId;
      setStatus(document.getElementById('dino-camera-status'), 'Разрешите доступ к камере в запросе браузера…', 'working');
      try {
        dinoCameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (requestId !== dinoCameraRequestId) {
          dinoCameraStream.getTracks().forEach(track => track.stop());
          dinoCameraStream = null;
          return;
        }
        dinoCameraVideo = document.createElement('video');
        dinoCameraVideo.autoplay = true;
        dinoCameraVideo.muted = true;
        dinoCameraVideo.playsInline = true;
        dinoCameraVideo.setAttribute('aria-label', 'Изображение с камеры для распознавания поз');
        dinoCameraVideo.srcObject = dinoCameraStream;
        dinoWebcamContainer.replaceChildren(dinoCameraVideo);
        await dinoCameraVideo.play();
        await new Promise((resolve, reject) => {
          if (dinoCameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }
          dinoCameraVideo.addEventListener('loadeddata', resolve, { once: true });
          dinoCameraVideo.addEventListener('error', () => reject(new Error('Не удалось получить изображение с камеры.')), { once: true });
        });
        if (requestId !== dinoCameraRequestId) {
          stopDinoCamera();
          return;
        }
        dinoInferenceRunning = true;
        dinoStopCameraButton.disabled = false;
        setStatus(document.getElementById('dino-camera-status'), 'Камера работает. Покажите позу и дождитесь распознавания.', 'success');
        runDinoPrediction();
      } catch (error) {
        stopDinoCamera();
        const name = error instanceof DOMException ? error.name : '';
        const message = name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Браузер не выдал доступ к камере. Разрешите камеру или откройте скачанный слайд отдельно.'
          : name === 'NotFoundError'
            ? 'Камера не найдена. Подключите камеру и проверьте, что она доступна системе.'
            : name === 'NotReadableError'
              ? 'Камера занята другим приложением. Закройте его и попробуйте снова.'
              : `Не удалось запустить камеру: ${error instanceof Error ? error.message : String(error)}`;
        setStatus(document.getElementById('dino-camera-status'), message, 'error');
      } finally {
        if (requestId === dinoCameraRequestId) {
          dinoCameraStartPending = false;
          dinoCameraButton.disabled = !dinoModel || dinoInferenceRunning;
        }
      }
    }

    async function applyDinoPrediction() {
      if (!dinoModel || !dinoCameraVideo || !dinoInferenceRunning) return;
      const predictions = await dinoModel.predict(dinoCameraVideo);
      const best = predictions.reduce((top, item) => item.probability > top.probability ? item : top);
      setDinoPrediction(best.className, best.probability);
      if (best.probability < Number(dinoThreshold.value) / 100) {
        dinoActionLabel.textContent = 'Уверенность ниже порога — команды нет';
        lastDinoActionClass = null;
        return;
      }
      if (best.className === dinoMappingSelects.neutral.value) {
        dinoActionLabel.textContent = 'Нейтральная поза — команды нет';
        lastDinoActionClass = null;
        return;
      }
      const actions = Object.entries(dinoMappingSelects)
        .filter(([key, select]) => key !== 'neutral' && select.value === best.className)
        .map(([key]) => key);
      if (actions.length > 1) {
        dinoActionLabel.textContent = 'Класс назначен нескольким командам — выберите разные классы';
        lastDinoActionClass = null;
        return;
      }
      if (!actions.length) {
        dinoActionLabel.textContent = 'Жест распознан; назначьте этому классу команду';
        lastDinoActionClass = null;
        return;
      }
      if (lastDinoActionClass === best.className) {
        dinoActionLabel.textContent = 'Команда уже выполнена; покажите нейтральную позу для повтора';
        return;
      }
      runDinoAction(actions[0]);
      lastDinoActionClass = best.className;
    }

    async function runDinoPrediction() {
      if (!dinoInferenceRunning) return;
      try {
        await applyDinoPrediction();
      } catch (error) {
        stopDinoCamera();
        setStatus(document.getElementById('dino-camera-status'), `Ошибка распознавания: ${error instanceof Error ? error.message : String(error)}`, 'error');
        return;
      }
      if (dinoInferenceRunning) window.setTimeout(runDinoPrediction, 180);
    }

    function stopDinoCamera() {
      dinoCameraRequestId += 1;
      dinoCameraStartPending = false;
      dinoInferenceRunning = false;
      if (dinoCameraVideo) {
        dinoCameraVideo.pause();
        dinoCameraVideo.srcObject = null;
        dinoCameraVideo = null;
      }
      if (dinoCameraStream) {
        dinoCameraStream.getTracks().forEach(track => track.stop());
        dinoCameraStream = null;
      }
      dinoWebcamContainer.replaceChildren(document.createTextNode('Камера остановлена'));
      dinoCameraButton.disabled = !dinoModel;
      dinoStopCameraButton.disabled = true;
      lastDinoActionClass = null;
    }

    async function loadModel(event) {
      event.preventDefault();
      if (!window.tmImage || !window.tf) {
        setStatus(modelStatus, 'Не удалось загрузить библиотеки модели. Проверьте подключение к интернету и обновите страницу.', 'error');
        return;
      }
      if (inferenceRunning || cameraStartPending) stopCamera();
      model = null;
      let loadedTensorflowModel = null;
      loadModelButton.disabled = true;
      cameraButton.disabled = true;
      Object.values(mappingSelects).forEach(select => {
        select.disabled = true;
        select.replaceChildren(new Option('Загрузка модели…', ''));
      });
      threshold.disabled = true;
      setStatus(modelStatus, 'Загружаю модель…', 'working');
      try {
        const baseUrl = readModelBaseUrl(document.getElementById('model-url').value);
        const refreshKey = `${Date.now()}-${crypto.randomUUID()}`;
        const modelUrl = addCacheBuster(`${baseUrl}model.json`, refreshKey);
        const metadataUrl = addCacheBuster(`${baseUrl}metadata.json`, refreshKey);
        const [tensorflowModel, metadataResponse] = await Promise.all([
          window.tf.loadLayersModel(modelUrl, { requestInit: { cache: 'no-store' } }),
          fetch(metadataUrl, { cache: 'no-store' })
        ]);
        loadedTensorflowModel = tensorflowModel;
        if (!metadataResponse.ok) {
          throw new Error(`Не удалось загрузить metadata.json (HTTP ${metadataResponse.status}).`);
        }
        const metadata = await metadataResponse.json();
        const labels = metadata.labels;
        if (!Array.isArray(labels) || !labels.every(label => typeof label === 'string')) {
          throw new Error('В metadata.json отсутствует список названий классов.');
        }
        if (!labels.length) throw new Error('В опубликованной модели не найдены классы.');
        const outputCount = tensorflowModel.outputs[0]?.shape[1];
        if (outputCount !== labels.length) {
          throw new Error(`Модель выдаёт ${outputCount ?? 'неизвестное число'} классов, а metadata.json содержит ${labels.length}. Опубликуйте модель заново в Teachable Machine и подключите новую ссылку.`);
        }
        const loadedModel = new window.tmImage.CustomMobileNet(tensorflowModel, metadata);
        model = loadedModel;
        loadedTensorflowModel = null;
        fillMappingOptions(labels);
        lastActionClass = null;
        cameraButton.disabled = false;
        setStatus(
          modelStatus,
          `Модель подключена · классов: ${labels.length}. Камера доступна; назначьте команды для нужных классов.`,
          'success'
        );
      } catch (error) {
        if (loadedTensorflowModel) loadedTensorflowModel.dispose();
        model = null;
        Object.values(mappingSelects).forEach(select => {
          select.disabled = true;
          select.replaceChildren(new Option('Не удалось загрузить модель', ''));
        });
        threshold.disabled = true;
        setStatus(modelStatus, `Не удалось загрузить модель: ${error instanceof Error ? error.message : String(error)}`, 'error');
      } finally {
        loadModelButton.disabled = false;
      }
    }

    async function startCamera() {
      if (!model) {
        setStatus(cameraStatus, 'Сначала подключите модель.', 'error');
        return;
      }
      if (!isCameraAllowedByFramePolicy()) {
        setStatus(cameraStatus, 'Google Sites блокирует камеру во встроенном окне. Нажмите «Открыть урок отдельно» ниже и разрешите камеру на открывшейся странице.', 'error');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(cameraStatus, 'Для камеры нужен HTTPS или localhost. Если урок открыт в Google Sites, нажмите «Открыть урок отдельно».', 'error');
        return;
      }
      cameraButton.disabled = true;
      cameraStartPending = true;
      const requestId = ++cameraRequestId;
      setStatus(cameraStatus, 'Разрешите доступ к камере в запросе браузера…', 'working');
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (requestId !== cameraRequestId) {
          cameraStream.getTracks().forEach(track => track.stop());
          cameraStream = null;
          return;
        }
        cameraVideo = document.createElement('video');
        cameraVideo.autoplay = true;
        cameraVideo.muted = true;
        cameraVideo.playsInline = true;
        cameraVideo.setAttribute('aria-label', 'Изображение с камеры для распознавания жестов');
        cameraVideo.srcObject = cameraStream;
        webcamContainer.replaceChildren(cameraVideo);
        await cameraVideo.play();
        await new Promise((resolve, reject) => {
          if (cameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }
          cameraVideo.addEventListener('loadeddata', resolve, { once: true });
          cameraVideo.addEventListener('error', () => reject(new Error('Не удалось получить изображение с камеры.')), { once: true });
        });
        if (requestId !== cameraRequestId) {
          stopCamera();
          return;
        }
        inferenceRunning = true;
        stopButton.disabled = false;
        setStatus(cameraStatus, 'Камера работает. Покажите жест и дождитесь распознавания.', 'success');
        runPrediction();
      } catch (error) {
        stopCamera();
        const name = error instanceof DOMException ? error.name : '';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const permissionDenied = name === 'NotAllowedError'
          || name === 'SecurityError'
          || /denied|permission|could not open your camera/i.test(errorMessage);
        const message = permissionDenied
          ? 'Браузер не выдал доступ к камере. Если урок встроен в Google Sites, нажмите «Открыть урок отдельно», разрешите камеру и попробуйте снова.'
          : name === 'NotFoundError'
            ? 'Камера не найдена. Подключите камеру и проверьте, что она доступна системе.'
            : name === 'NotReadableError'
              ? 'Камера занята другим приложением. Закройте его и попробуйте снова.'
              : `Не удалось запустить камеру. Проверьте разрешение браузера и доступность камеры. ${errorMessage}`;
        setStatus(cameraStatus, message, 'error');
      } finally {
        if (requestId === cameraRequestId) {
          cameraStartPending = false;
          cameraButton.disabled = !model || inferenceRunning;
        }
      }
    }

    function mappedAction(className) {
      const actions = Object.entries(mappingSelects)
        .filter(([key, select]) => key !== 'neutral' && select.value === className)
        .map(([key]) => key);
      return actions.length === 1 ? actions[0] : actions.length > 1 ? 'ambiguous' : '';
    }

    async function applyPrediction() {
      if (!model || !cameraVideo || !inferenceRunning) return;
      const predictions = await model.predict(cameraVideo);
      const best = predictions.reduce((top, item) => item.probability > top.probability ? item : top);
      const score = best.probability;
      setPrediction(best.className, score);

      if (score < Number(threshold.value) / 100) {
        actionLabel.textContent = 'Уверенность ниже порога — команды нет';
        lastActionClass = null;
        return;
      }
      if (best.className === mappingSelects.neutral.value) {
        actionLabel.textContent = 'Нейтральный класс — команды нет';
        lastActionClass = null;
        return;
      }
      const action = mappedAction(best.className);
      if (action === 'ambiguous') {
        actionLabel.textContent = 'Этот класс назначен нескольким командам; выберите для каждой команды свой класс';
        lastActionClass = null;
        return;
      }
      if (!action) {
        actionLabel.textContent = 'Жест распознан; назначьте этому классу команду';
        lastActionClass = null;
        return;
      }
      if (lastActionClass === best.className) {
        actionLabel.textContent = 'Команда уже выполнена; покажите нейтральный жест для повтора';
        return;
      }

      if (action === 'up') {
        volumeControl.value = String(Math.min(100, Number(volumeControl.value) + 10));
        updateVolume();
        actionLabel.textContent = 'Громкость аудиофайла увеличена на 10%';
      } else if (action === 'down') {
        volumeControl.value = String(Math.max(0, Number(volumeControl.value) - 10));
        updateVolume();
        actionLabel.textContent = 'Громкость аудиофайла уменьшена на 10%';
      } else if (action === 'forward' || action === 'back') {
        if (!audioPlayer.src || audioPlayer.error) {
          actionLabel.textContent = 'Выберите аудиофайл для перемотки';
        } else if (!Number.isFinite(audioPlayer.duration)) {
          actionLabel.textContent = 'Дождитесь загрузки аудиофайла';
        } else {
          const direction = action === 'forward' ? 1 : -1;
          const targetTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + direction * 10));
          audioPlayer.currentTime = targetTime;
          actionLabel.textContent = action === 'forward' ? 'Перемотка вперёд на 10 секунд' : 'Перемотка назад на 10 секунд';
        }
      } else if (action === 'play') {
        if (!audioPlayer.src || audioPlayer.error) {
          actionLabel.textContent = 'Не удалось загрузить музыку. Выберите аудиофайл.';
        } else if (audioPlayer.paused) {
          try {
            await audioPlayer.play();
            actionLabel.textContent = 'Аудио воспроизводится';
          } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              actionLabel.textContent = 'Сначала нажмите ▶ на аудиоплеере, чтобы разрешить воспроизведение';
            } else {
              throw error;
            }
          }
        } else {
          actionLabel.textContent = 'Музыка уже воспроизводится';
        }
      } else if (action === 'pause') {
        if (audioPlayer.error) {
          actionLabel.textContent = 'Не удалось загрузить музыку. Выберите аудиофайл.';
          lastActionClass = best.className;
          return;
        }
        if (!audioPlayer.paused) {
          audioPlayer.pause();
          actionLabel.textContent = 'Музыка приостановлена';
        } else {
          actionLabel.textContent = 'Музыка уже на паузе';
        }
      }
      lastActionClass = best.className;
    }

    async function runPrediction() {
      if (!inferenceRunning) return;
      try {
        await applyPrediction();
      } catch (error) {
        stopCamera();
        setStatus(cameraStatus, `Ошибка распознавания: ${error instanceof Error ? error.message : String(error)}`, 'error');
        return;
      }
      if (inferenceRunning) window.setTimeout(runPrediction, 180);
    }

    function stopCamera() {
      cameraRequestId += 1;
      cameraStartPending = false;
      inferenceRunning = false;
      if (cameraVideo) {
        cameraVideo.pause();
        cameraVideo.srcObject = null;
        cameraVideo = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      webcamContainer.replaceChildren(document.createTextNode('Камера остановлена'));
      cameraButton.disabled = !model;
      stopButton.disabled = true;
      lastActionClass = null;
    }

    modelForm.addEventListener('submit', loadModel);
    downloadSlideButton.addEventListener('click', () => downloadAndOpenSlide(3));
    dinoModelForm.addEventListener('submit', loadDinoModel);
    downloadDinoSlideButton.addEventListener('click', () => downloadAndOpenSlide(5));
    cameraButton.addEventListener('click', startCamera);
    dinoCameraButton.addEventListener('click', startDinoCamera);
    document.getElementById('dino-stop-camera').addEventListener('click', () => {
      stopDinoCamera();
      setStatus(document.getElementById('dino-camera-status'), 'Камера остановлена.', '');
    });
    document.getElementById('dino-start').addEventListener('click', () => startDinoGame(true));
    document.getElementById('dino-stop').addEventListener('click', pauseDinoGame);
    document.getElementById('dino-jump').addEventListener('click', jumpDino);
    document.getElementById('dino-duck').addEventListener('click', duckDino);
    stopButton.addEventListener('click', () => {
      stopCamera();
      setStatus(cameraStatus, 'Камера остановлена.', '');
    });
    threshold.addEventListener('input', updateThreshold);
    dinoThreshold.addEventListener('input', updateDinoThreshold);
    volumeControl.addEventListener('input', updateVolume);

    audioFile.addEventListener('change', () => {
      const file = audioFile.files && audioFile.files[0];
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
      audioPlayer.pause();
      if (!file) {
        audioPlayer.src = defaultAudioUrl;
        audioPlayer.load();
        return;
      }
      currentAudioUrl = URL.createObjectURL(file);
      audioPlayer.src = currentAudioUrl;
      audioPlayer.load();
      setStatus(audioStatus, `Выбран файл: ${file.name}.`, 'success');
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      setStatus(audioStatus, 'Музыка готова. Нажмите ▶ в плеере, затем проверяйте жесты.', 'success');
    });
    audioPlayer.addEventListener('error', () => {
      setStatus(audioStatus, 'Источник музыки недоступен. Выберите аудиофайл с компьютера.', 'error');
    });

    window.addEventListener('pagehide', () => {
      stopCamera();
      stopDinoCamera();
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
    });

    updateThreshold();
    updateDinoThreshold();
    updateVolume();
    drawDinoScene();
    initParticles();
    updateAnimation();
    goToHash();
  };

  /* Lesson 10emn-10 (10 ЕМН - 10 урок) */
  LESSON_SCRIPTS['10emn-10'] = function() {
const slides = [...document.querySelectorAll(".slide")];
const bar = document.getElementById("progress");
const dotsNav = document.getElementById("dotsNav");
const dotLabels = ["01 · Титул", "02 · 5 шагов", "03 · Что есть что", "04 · Модель k-NN", "05 · Практика", "06 · Оценивание"];
let current = 0;

slides.forEach((slide, n) => {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.type = "button";
  dot.title = dotLabels[n] || `Слайд ${n + 1}`;
  dot.setAttribute("aria-label", "Перейти к слайду: " + dot.title);
  dot.onclick = () => show(n);
  dotsNav.appendChild(dot);

  const nextBtn = document.createElement("button");
  nextBtn.className = "slide-next";
  nextBtn.type = "button";
  nextBtn.textContent = n === slides.length - 1 ? "В начало" : "Далее →";
  nextBtn.onclick = () => show(n === slides.length - 1 ? 0 : n + 1);
  slide.appendChild(nextBtn);
});

const dots = [...document.querySelectorAll(".dot")];
const mobilePrev = document.getElementById("mobilePrev");
const mobileNext = document.getElementById("mobileNext");

function show(i) {
  current = Math.max(0, Math.min(i, slides.length - 1));
  slides.forEach((s, n) => s.classList.toggle("active", n === current));
  dots.forEach((d, n) => d.classList.toggle("active", n === current));
  bar.style.width = ((current + 1) / slides.length * 100) + "%";
  mobilePrev.disabled = current === 0;
  mobileNext.disabled = current === slides.length - 1;
}

mobilePrev.onclick = () => show(current - 1);
mobileNext.onclick = () => show(current + 1);

document.addEventListener("keydown", e => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (!typing && ["ArrowRight", "PageDown", " "].includes(e.key)) {
    e.preventDefault();
    show(current + 1);
  }
  if (!typing && ["ArrowLeft", "PageUp"].includes(e.key)) {
    e.preventDefault();
    show(current - 1);
  }
  if (!typing && e.key.toLowerCase() === "f") {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }
});

// Canvas particle background
const canvas = document.getElementById("network-bg");
const ctx = canvas.getContext("2d");
let points = [];
function initNetwork() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  points = Array.from({ length: 48 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - .5) * .35,
    vy: (Math.random() - .5) * .35,
    r: 1.3 + Math.random() * 2
  }));
}
function drawNetwork() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(124,77,255,.09)";
  points.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    ctx.fillStyle = "rgba(81,196,166,.18)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    for (let j = i + 1; j < points.length; j++) {
      const q = points[j];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 140) {
        ctx.globalAlpha = 1 - d / 140;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  });
  requestAnimationFrame(drawNetwork);
}
window.addEventListener("resize", initNetwork);
initNetwork();
drawNetwork();
show(0);

// Pipeline step click
document.querySelectorAll(".pipe").forEach(pipe => {
  pipe.onclick = () => {
    document.querySelectorAll(".pipe").forEach(p => p.classList.remove("active"));
    pipe.classList.add("active");
    document.getElementById("pipeStepInfo").textContent = pipe.dataset.desc;
  };
});

// Interactive k-NN simulator on slide 5
function setK(k) {
  document.querySelectorAll(".k-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  
  const p2 = document.getElementById("pt2");
  const p4 = document.getElementById("pt4");
  const p7 = document.getElementById("pt7");
  const p9 = document.getElementById("pt9");

  const r2 = document.getElementById("row2");
  const r4 = document.getElementById("row4");
  const r7 = document.getElementById("row7");
  const r9 = document.getElementById("row9");

  [p2, p4, p7, p9].forEach(p => { p.style.transform = "translate(-50%,-50%) scale(1)"; p.style.boxShadow = "0 6px 14px rgba(0,0,0,.15)"; });
  [r2, r4, r7, r9].forEach(r => r.classList.remove("highlight"));

  const summary = document.getElementById("simSummary");
  const voteBox = document.getElementById("voteBox");

  if (k === 1) {
    p4.style.transform = "translate(-50%,-50%) scale(1.35)";
    p4.style.boxShadow = "0 0 0 6px #3b82f640";
    r4.classList.add("highlight");
    summary.innerHTML = "При k=1: Ближайший сосед <strong>4 (Класс A)</strong> → Прогноз: <strong>Класс A</strong>";
    voteBox.innerHTML = "<p>При <strong>k = 1</strong> берём 1-го ближайшего соседа: точку <strong>4</strong> (расстояние 1).<br>Её класс: <strong style='color:#2563eb'>Класс A</strong>.<br>Итоговый прогноз модели: <span class='badge-tag badge-A'>Класс A</span>.</p>";
  } else if (k === 3) {
    p4.style.transform = "translate(-50%,-50%) scale(1.25)";
    p7.style.transform = "translate(-50%,-50%) scale(1.25)";
    p2.style.transform = "translate(-50%,-50%) scale(1.25)";
    p4.style.boxShadow = "0 0 0 5px #3b82f640";
    p7.style.boxShadow = "0 0 0 5px #ec489940";
    p2.style.boxShadow = "0 0 0 5px #3b82f640";
    [r4, r7, r2].forEach(r => r.classList.add("highlight"));
    summary.innerHTML = "При k=3: Соседи 4 (A), 7 (B), 2 (A) → Голоса: <strong>2 за A vs 1 за B</strong> → Прогноз: <strong>Класс A</strong>";
    voteBox.innerHTML = "<p>При <strong>k = 3</strong> берём 3 ближайших соседа:<br>1. Точка <strong>4</strong> (Класс A, d=1)<br>2. Точка <strong>7</strong> (Класс B, d=2)<br>3. Точка <strong>2</strong> (Класс A, d=3)<br><strong>Голосование:</strong> Класс A (2 голоса), Класс B (1 голос). Большинство за <span class='badge-tag badge-A'>Класс A</span>!</p>";
  } else if (k === 4) {
    [p4, p7, p2, p9].forEach(p => { p.style.transform = "translate(-50%,-50%) scale(1.15)"; });
    [r4, r7, r2, r9].forEach(r => r.classList.add("highlight"));
    summary.innerHTML = "При k=4: Соседи {2,4} (A) и {7,9} (B) → Ничья 2:2!";
    voteBox.innerHTML = "<p style='color:#ad5928'>⚠️ <strong>Ничья при чётном k=4:</strong><br>Взяты все 4 точки: две из Класса A и две из Класса B. Счёт 2 : 2. Алгоритм не может однозначно выбрать победителя! Именно поэтому в бинарной классификации всегда выбирают <strong>нечётное k</strong>.</p>";
  }
}

// State storing current random numbers for Slide 6 practice
let currentRandomState = {
  a1: 2, a2: 4,
  b1: 7, b2: 9,
  newX: 5
};

// Automatic randomizer for Class points and New X in Slide 6
function generateRandomTasks() {
  let found = false;
  let attempts = 0;

  while (!found && attempts < 250) {
    attempts++;
    // Cluster A: 2 random distinct numbers from 1 to 6
    const poolA = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    const aPts = [poolA[0], poolA[1]].sort((x, y) => x - y);

    // Cluster B: 2 random distinct numbers from 7 to 14
    const poolB = [7, 8, 9, 10, 11, 12, 13, 14].sort(() => Math.random() - 0.5);
    const bPts = [poolB[0], poolB[1]].sort((x, y) => x - y);

    // Pick candidate X between 2 and 12
    const candidateX = Math.floor(Math.random() * 11) + 2;
    const allPts = [aPts[0], aPts[1], bPts[0], bPts[1]];

    if (allPts.includes(candidateX)) continue;

    // Check all 4 distances from candidateX to points are unique
    const dists = allPts.map(p => Math.abs(candidateX - p));
    const distSet = new Set(dists);
    if (distSet.size === 4) {
      currentRandomState = {
        a1: aPts[0],
        a2: aPts[1],
        b1: bPts[0],
        b2: bPts[1],
        newX: candidateX
      };
      found = true;
    }
  }

  const { a1, a2, b1, b2, newX } = currentRandomState;

  // Update Slide 6 subtitle with new numbers
  const cAText = document.getElementById("classAValues");
  if (cAText) cAText.textContent = `${a1}, ${a2}`;
  const cBText = document.getElementById("classBValues");
  if (cBText) cBText.textContent = `${b1}, ${b2}`;

  // Update notebook tasks
  const t1X = document.getElementById("task1X");
  if (t1X) t1X.textContent = "X = " + newX;
  const t1Label = document.getElementById("t1Label");
  if (t1Label) t1Label.textContent = newX;
  const t2Label = document.getElementById("t2Label");
  if (t2Label) t2Label.textContent = "X = " + newX;
  const t3Label = document.getElementById("t3Label");
  if (t3Label) t3Label.textContent = "X = " + newX;

  const ptList = document.getElementById("taskPointsList");
  if (ptList) ptList.textContent = `${a1}, ${a2}, ${b1}, ${b2}`;

  const t1Hint = document.getElementById("t1Hint");
  if (t1Hint) t1Hint.textContent = `Запишите: d₁ = |${newX} - ${a1}|, d₂ = |${newX} - ${a2}|, d₃ = |${newX} - ${b1}|, d₄ = |${newX} - ${b2}|`;

  // Update table cells (Column A: class features, Column C: new X)
  const elA1 = document.getElementById("tableA1");
  if (elA1) elA1.textContent = a1;
  const elA2 = document.getElementById("tableA2");
  if (elA2) elA2.textContent = a2;
  const elA3 = document.getElementById("tableA3");
  if (elA3) elA3.textContent = b1;
  const elA4 = document.getElementById("tableA4");
  if (elA4) elA4.textContent = b2;
  const tableX = document.getElementById("tableXVal");
  if (tableX) tableX.textContent = newX;
}

// Download Blank CSV table with generated values (без формул)
function downloadBlankTable() {
  const { a1, a2, b1, b2, newX } = currentRandomState;
  const csvContent = "\uFEFF" + 
    "Признак;Класс;Новый_X;Расстояние;Ранг;Параметр_K;Голоса А;Голоса Б;Победитель\n" +
    `${a1};A;${newX};;;1;;;\n` +
    `${a2};A;;;;;;;\n` +
    `${b1};B;;;;;;;\n` +
    `${b2};B;;;;;;;\n`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "knn_shablon_dlya_uchenikov.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Automatically generate random task numbers on page load
generateRandomTasks();

// 2D Interactive Plane for Slide 4
const bluePoints = [
  {x: 80, y: 90, class: 'A'},
  {x: 120, y: 140, class: 'A'},
  {x: 95, y: 210, class: 'A'},
  {x: 160, y: 80, class: 'A'},
  {x: 150, y: 180, class: 'A'},
  {x: 190, y: 130, class: 'A'}
];
const redPoints = [
  {x: 380, y: 95, class: 'B'},
  {x: 420, y: 165, class: 'B'},
  {x: 350, y: 205, class: 'B'},
  {x: 320, y: 125, class: 'B'},
  {x: 440, y: 95, class: 'B'},
  {x: 390, y: 255, class: 'B'}
];
const allPlanePoints = [...bluePoints, ...redPoints];
let planeK = 1;
let currentXPoint = null;

function setPlaneK(k) {
  planeK = k;
  [1, 3, 5].forEach(val => {
    const btn = document.getElementById('btnPlaneK' + val);
    if (btn) btn.classList.toggle('active', val === k);
  });
  if (currentXPoint) {
    updatePlanePrediction(currentXPoint.x, currentXPoint.y);
  }
}

const planeSvg = document.getElementById("planeSvg");
if (planeSvg) {
  planeSvg.addEventListener("click", e => {
    const rect = planeSvg.getBoundingClientRect();
    const scaleX = 500 / rect.width;
    const scaleY = 360 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    currentXPoint = {x, y};
    updatePlanePrediction(x, y);
  });
}

function updatePlanePrediction(x, y) {
  const pGroup = document.getElementById("planeNewPoint");
  const pCircle = document.getElementById("planeNewCircle");
  const pText = document.getElementById("planeNewText");
  const neighborhood = document.getElementById("planeNeighborhood");
  const linesGroup = document.getElementById("planeNeighborLines");
  const badgeClass = document.getElementById("planeBadgeClass");
  const resultDetails = document.getElementById("planeResultDetails");

  pGroup.style.display = "block";
  pCircle.setAttribute("cx", x);
  pCircle.setAttribute("cy", y);
  pText.setAttribute("x", x);
  pText.setAttribute("y", y + 4);

  // Calculate Euclidean distances
  const distances = allPlanePoints.map(p => ({
    ...p,
    d: Math.hypot(p.x - x, p.y - y)
  })).sort((a, b) => a.d - b.d);

  const nearest = distances.slice(0, planeK);
  const maxDist = nearest[nearest.length - 1].d;

  // Show circular neighborhood
  neighborhood.style.display = "block";
  neighborhood.setAttribute("cx", x);
  neighborhood.setAttribute("cy", y);
  neighborhood.setAttribute("r", Math.max(16, maxDist + 6));

  // Draw lines to nearest neighbors
  linesGroup.innerHTML = nearest.map(p => `
    <line x1="${x}" y1="${y}" x2="${p.x}" y2="${p.y}" stroke="${p.class === 'A' ? '#3b82f6' : '#f43f5e'}" stroke-width="2" stroke-dasharray="3 3"/>
  `).join("");

  // Count votes
  const blueCount = nearest.filter(p => p.class === 'A').length;
  const redCount = nearest.filter(p => p.class === 'B').length;

  if (blueCount > redCount) {
    pCircle.setAttribute("fill", "#2563eb");
    badgeClass.className = "badge-tag badge-A";
    badgeClass.textContent = "Класс Синий (A)";
    resultDetails.innerHTML = `При <strong>k=${planeK}</strong> в окружность попало <strong>${blueCount} синих</strong> и <strong>${redCount} красных</strong> соседей.<br>Победило большинство: точка отнесена к <strong style="color:#2563eb">Синему классу</strong>!`;
  } else if (redCount > blueCount) {
    pCircle.setAttribute("fill", "#e11d48");
    badgeClass.className = "badge-tag badge-B";
    badgeClass.textContent = "Класс Красный (B)";
    resultDetails.innerHTML = `При <strong>k=${planeK}</strong> в окружность попало <strong>${redCount} красных</strong> и <strong>${blueCount} синих</strong> соседей.<br>Победило большинство: точка отнесена к <strong style="color:#e11d48">Красному классу</strong>!`;
  } else {
    pCircle.setAttribute("fill", "var(--coral)");
    badgeClass.className = "badge-tag badge-X";
    badgeClass.textContent = "Ничья (50% на 50%)";
    resultDetails.innerHTML = `Ничья: поровну синих и красных соседей. Поэтому всегда выбирают нечётное <strong>k</strong>!`;
  }
}

// Initial demo point for plane
setTimeout(() => {
  if (planeSvg) {
    currentXPoint = {x: 230, y: 150};
    updatePlanePrediction(230, 150);
  }
}, 300);
  };

  /* Lesson 10ogn-1 (10 ОГН - 1 урок) */
  LESSON_SCRIPTS['10ogn-1'] = function() {
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.getElementById('dots');
        const totalSlides = slides.length;
        const dotLabels = [
            'Старт урока',
            'Линия времени',
            'Этапы развития',
            'Лаборатория',
            'Зимы ИИ',
            'Данные',
            'Технологии',
            'Кейс',
            'Проверка',
            'Итог',
            'Завершение'
        ];

        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.label = dotLabels[index] || `Слайд ${index + 1}`;
            dot.title = dot.dataset.label;
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        const nextButtonLabels = [
            '',
            'К линии времени',
            'К разбору этапов',
            'К лаборатории',
            'К зимам ИИ',
            'К данным',
            'К технологиям',
            'К кейсу',
            'К проверке',
            'К итогу'
        ];

        slides.forEach((slide, index) => {
            if (index === 0 || index === totalSlides - 1) return;
            const container = slide.querySelector('.container');
            if (!container) return;

            const actionRow = document.createElement('div');
            actionRow.className = 'slide-action-row';

            const button = document.createElement('button');
            button.className = 'nav-btn start-btn';
            button.type = 'button';
            button.innerHTML = `${nextButtonLabels[index] || 'Дальше'} <i class="fas fa-arrow-right"></i>`;
            button.onclick = () => changeSlide(1);

            actionRow.appendChild(button);
            container.appendChild(actionRow);
        });

        function updateUI() {
            slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
            document.querySelectorAll('.dot').forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
            document.getElementById('progress').style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }

        function changeSlide(direction) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + direction));
            updateUI();
        }

        function goToSlide(index) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, index));
            updateUI();
        }

        const eraData = {
            dream: {
                title: '1940-1950-е: машина как новая форма мышления',
                text: 'В этот период появляются первые электронные компьютеры и вопрос: можно ли описать мышление как вычисление? ИИ еще не умеет почти ничего, но рождается язык будущих исследований.',
                algorithm: 'Логика, поиск, первые математические модели нейронов.',
                tech: 'Огромные и медленные машины с маленькой памятью.',
                data: 'Данные почти не используются: программы больше зависят от правил и расчетов.'
            },
            rules: {
                title: '1960-1970-е: символический ИИ',
                text: 'Ученые пытаются описать интеллект через символы и правила. Машина манипулирует понятиями, доказывает теоремы, играет в простые игры, но слабо понимает контекст.',
                algorithm: 'Правила “если-то”, логический вывод, перебор вариантов.',
                tech: 'Компьютеры становятся доступнее, но все еще слишком ограничены.',
                data: 'Больших цифровых массивов нет, поэтому знания вводят вручную.'
            },
            expert: {
                title: '1980-е: экспертные системы',
                text: 'ИИ начинает приносить пользу в медицине, промышленности и диагностике. Но систему нужно вручную кормить правилами экспертов, а это дорого и хрупко.',
                algorithm: 'Базы знаний, цепочки вывода, экспертные правила.',
                tech: 'Корпоративные компьютеры и рабочие станции помогают внедрять системы.',
                data: 'Главный источник знаний - интервью со специалистами, а не массовые датасеты.'
            },
            learn: {
                title: '1990-2000-е: машинное обучение',
                text: 'Фокус смещается: не программировать каждое правило, а обучать модель на примерах. ИИ становится статистическим и начинает выигрывать там, где есть данные.',
                algorithm: 'Деревья решений, метод опорных векторов, байесовские модели, ансамбли.',
                tech: 'Персональные компьютеры, серверы и интернет ускоряют эксперименты.',
                data: 'Появляются цифровые базы, поисковые системы, транзакции, клики и тексты.'
            },
            deep: {
                title: '2012-2020-е: глубокое обучение',
                text: 'Глубокие нейросети показывают резкий рост качества в изображениях, речи и переводе. Старые идеи нейросетей наконец получают нужную мощность и данные.',
                algorithm: 'Многослойные нейронные сети, сверточные сети, обратное распространение ошибки.',
                tech: 'GPU позволяют параллельно обучать большие модели.',
                data: 'Миллионы изображений, аудио, текстов и пользовательских действий.'
            },
            gen: {
                title: '2020-е: генеративный ИИ',
                text: 'Модели начинают не только классифицировать, но и создавать: текст, изображения, код, звук. Возникает вопрос не “может ли ИИ распознать?”, а “как его ответственно использовать?”.',
                algorithm: 'Трансформеры, большие языковые модели, диффузионные модели.',
                tech: 'Кластеры GPU, облачные платформы, оптимизация обучения.',
                data: 'Огромные корпуса текстов, изображений, кода и диалогов.'
            }
        };

        function renderEra(key) {
            const era = eraData[key];
            document.querySelectorAll('.era-btn').forEach((button) => {
                button.classList.toggle('active', button.getAttribute('onclick').includes(`'${key}'`));
            });

            document.getElementById('eraContent').innerHTML = `
                <h3>${era.title}</h3>
                <p>${era.text}</p>
                <div class="mini-grid">
                    <div class="mini"><strong>Алгоритмы</strong><p>${era.algorithm}</p></div>
                    <div class="mini"><strong>Технологии</strong><p>${era.tech}</p></div>
                    <div class="mini"><strong>Данные</strong><p>${era.data}</p></div>
                </div>
                <div class="insight" style="margin-top: 18px;">
                    <p><b>Аналитический вывод:</b> чтобы объяснить этот этап, связывайте научную идею с тем, какие компьютеры и какие данные были доступны в то время.</p>
                </div>
            `;
        }

        const algRange = document.getElementById('algRange');
        const computeRange = document.getElementById('computeRange');
        const dataRange = document.getElementById('dataRange');

        function updateLab() {
            const algorithm = Number(algRange.value);
            const compute = Number(computeRange.value);
            const data = Number(dataRange.value);
            const bottleneck = Math.min(algorithm, compute, data);
            const average = Math.round((algorithm + compute + data) / 3);
            const score = Math.round(average * 0.55 + bottleneck * 0.45);
            const model = Math.round((algorithm * 0.5 + data * 0.35 + compute * 0.15));
            const speed = Math.round((compute * 0.7 + algorithm * 0.2 + data * 0.1));
            const world = Math.round((data * 0.65 + algorithm * 0.25 + compute * 0.1));

            document.getElementById('algLabel').textContent = algorithm;
            document.getElementById('computeLabel').textContent = compute;
            document.getElementById('dataLabel').textContent = data;
            document.getElementById('powerScore').textContent = score;
            document.getElementById('modelScore').textContent = `${model}%`;
            document.getElementById('speedScore').textContent = `${speed}%`;
            document.getElementById('worldScore').textContent = `${world}%`;
            document.getElementById('modelFill').style.width = `${model}%`;
            document.getElementById('speedFill').style.width = `${speed}%`;
            document.getElementById('worldFill').style.width = `${world}%`;

            const weakest = [
                ['алгоритмы', algorithm],
                ['вычисления', compute],
                ['данные', data]
            ].sort((a, b) => a[1] - b[1])[0][0];

            const text = score > 78
                ? 'Все три фактора достаточно сильны. Такая ситуация похожа на эпохи больших прорывов: можно обучать сложные модели на больших данных.'
                : `Главное ограничение сейчас - ${weakest}. Именно слабое звено объясняет, почему развитие ИИ в разные эпохи могло замедляться.`;

            document.getElementById('powerText').textContent = score > 78
                ? 'Условия почти идеальные: модель может становиться мощной, масштабной и полезной.'
                : 'Система уже может решать отдельные задачи, но масштабный прорыв ограничен одним из факторов.';
            document.getElementById('labInsight').innerHTML = `<p><b>Вывод:</b> ${text}</p>`;
        }

        [algRange, computeRange, dataRange].forEach((input) => input.addEventListener('input', updateLab));

        const quizQuestions = [
            {
                question: 'Почему символический ИИ 1960-1970-х плохо справлялся с реальным миром?',
                answer: 'Потому что реальность трудно полностью описать ручными правилами и исключениями',
                options: ['Потому что тогда вообще не было компьютеров', 'Потому что ИИ умел только создавать изображения', 'Потому что данные были слишком большими для человека'],
                feedback: 'Верно: правила работают в узких задачах, но плохо выдерживают неоднозначность языка, зрения и поведения людей.'
            },
            {
                question: 'Что сильнее всего отличает машинное обучение от экспертных систем?',
                answer: 'Модель учится на примерах, а не только выполняет заранее записанные правила',
                options: ['Машинное обучение не использует данные', 'Экспертные системы всегда работают быстрее современных моделей', 'Машинное обучение появилось раньше первых компьютеров'],
                feedback: 'Точно: сдвиг от ручных правил к обучению на данных стал ключевым поворотом в истории ИИ.'
            },
            {
                question: 'Почему глубокое обучение резко усилилось после 2010-х?',
                answer: 'Сошлись нейросетевые методы, мощные GPU и большие датасеты',
                options: ['Ученые впервые придумали слово “алгоритм”', 'Компьютеры перестали использовать математику', 'Все программы стали писать без данных'],
                feedback: 'Верно: старые идеи нейросетей получили новую силу благодаря вычислениям и данным.'
            },
            {
                question: 'Что такое “зима ИИ”?',
                answer: 'Период падения интереса и финансирования из-за завышенных ожиданий и слабых результатов',
                options: ['Время, когда ИИ применяли только зимой', 'Этап, когда ИИ полностью исчез из науки', 'Период запрета на использование компьютеров'],
                feedback: 'Да: зима ИИ показывает, что развитие технологий зависит не только от идей, но и от реальных возможностей эпохи.'
            },
            {
                question: 'Почему увеличение данных не всегда автоматически улучшает ИИ?',
                answer: 'Данные могут быть шумными, однобокими, ошибочными или плохо размеченными',
                options: ['Чем больше данных, тем модель всегда честнее', 'Данные не влияют на обучение моделей', 'Большие данные нужны только для игр'],
                feedback: 'Правильно: важен не только объем, но и качество, разнообразие и корректная разметка.'
            },
            {
                question: 'Как лучше объяснить развитие генеративного ИИ 2020-х?',
                answer: 'Через сочетание трансформеров, огромных корпусов данных и мощных вычислительных кластеров',
                options: ['Только через желание пользователей получать красивые ответы', 'Только через появление смартфонов', 'Только через ручное написание всех возможных ответов'],
                feedback: 'Именно: генеративный ИИ стал возможен благодаря совместному росту алгоритмов, данных и инфраструктуры.'
            }
        ];

        let quizOrder = [];
        let quizIndex = 0;
        let quizScore = 0;
        let waitingForNext = false;
        const quizQuestion = document.getElementById('quizQuestion');
        const quizOptions = document.getElementById('quizOptions');
        const quizFeedback = document.getElementById('quizFeedback');
        const quizCounter = document.getElementById('quizCounter');
        const quizScoreLabel = document.getElementById('quizScore');

        function shuffle(items) {
            const result = [...items];
            for (let index = result.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }
            return result;
        }

        function startQuiz() {
            quizOrder = shuffle(quizQuestions);
            quizIndex = 0;
            quizScore = 0;
            waitingForNext = false;
            renderQuizQuestion();
        }

        function renderQuizQuestion() {
            const current = quizOrder[quizIndex];
            const options = shuffle([current.answer, ...current.options]);
            quizCounter.textContent = `Вопрос ${quizIndex + 1} / ${quizOrder.length}`;
            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;
            quizQuestion.textContent = current.question;
            quizFeedback.textContent = 'Выберите ответ.';
            quizOptions.innerHTML = '';
            waitingForNext = false;

            options.forEach((text) => {
                const button = document.createElement('button');
                button.className = 'quiz-option';
                button.type = 'button';
                button.textContent = text;
                button.onclick = () => answerQuiz(button, text === current.answer, current.feedback);
                quizOptions.appendChild(button);
            });
        }

        function answerQuiz(selectedButton, isCorrect, feedback) {
            if (waitingForNext) return;
            waitingForNext = true;

            document.querySelectorAll('.quiz-option').forEach((button) => {
                button.disabled = true;
                if (button.textContent === quizOrder[quizIndex].answer) button.classList.add('correct');
            });

            if (isCorrect) {
                quizScore += 1;
                selectedButton.classList.add('correct');
                quizFeedback.textContent = feedback;
            } else {
                selectedButton.classList.add('wrong');
                quizFeedback.textContent = `${feedback} Правильный ответ: ${quizOrder[quizIndex].answer}`;
            }

            quizScoreLabel.textContent = `Верных ответов: ${quizScore}`;

            window.setTimeout(() => {
                quizIndex += 1;
                if (quizIndex >= quizOrder.length) {
                    quizCounter.textContent = 'Квиз завершен';
                    quizQuestion.textContent = `Результат: ${quizScore} из ${quizOrder.length}`;
                    quizOptions.innerHTML = '<button class="quiz-option" type="button" id="restartQuiz">Пройти еще раз в новом порядке</button>';
                    quizFeedback.textContent = quizScore >= 5
                        ? 'Отлично: вы уверенно связываете этапы ИИ с алгоритмами, технологиями и данными.'
                        : 'Неплохо. Пройдите еще раз и обращайте внимание на слабое звено каждой эпохи: данные, мощность или методы.';
                    document.getElementById('restartQuiz').onclick = startQuiz;
                    waitingForNext = false;
                    return;
                }
                renderQuizQuestion();
            }, 1800);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') changeSlide(1);
            if (event.key === 'ArrowLeft') changeSlide(-1);
        });

        const canvas = document.getElementById('network-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = Array.from({ length: 58 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.34,
                vy: (Math.random() - 0.5) * 0.34,
                r: 1.4 + Math.random() * 1.9
            }));
        }

        function drawNetwork() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.09)';
            ctx.fillStyle = 'rgba(8, 145, 178, 0.16)';

            particles.forEach((point, index) => {
                point.x += point.vx;
                point.y += point.vy;
                if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
                if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
                ctx.fill();

                for (let next = index + 1; next < particles.length; next++) {
                    const other = particles[next];
                    const distance = Math.hypot(point.x - other.x, point.y - other.y);
                    if (distance < 150) {
                        ctx.globalAlpha = 1 - distance / 150;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            });

            requestAnimationFrame(drawNetwork);
        }

        window.addEventListener('resize', initParticles);
        renderEra('dream');
        updateLab();
        startQuiz();
        updateUI();
        initParticles();
        drawNetwork();
  };

  /* Lesson 10ogn-2 (10 ОГН - 2 урок) */
  LESSON_SCRIPTS['10ogn-2'] = function() {
const slides=[...document.querySelectorAll(".slide")],bar=document.getElementById("progress"),dotsNav=document.getElementById("dotsNav");let current=0;
const dotLabels=["Старт","Повторение","Смена подхода","Карта понятий","Данные","Признаки","Обучение","Модель","Прогноз","Итог","Завершение"];
const imageModal=document.getElementById("imageModal");document.querySelector(".zoomable-image").onclick=()=>imageModal.showModal();imageModal.querySelector("button").onclick=()=>imageModal.close();imageModal.onclick=e=>{if(e.target===imageModal)imageModal.close()};
slides.forEach((slide,n)=>{const dot=document.createElement("button");dot.className="dot";dot.type="button";dot.dataset.label=dotLabels[n]||`Слайд ${n+1}`;dot.title=dot.dataset.label;dot.setAttribute("aria-label","Перейти к слайду: "+dot.dataset.label);dot.onclick=()=>show(n);dotsNav.appendChild(dot);const nextBtn=document.createElement("button");nextBtn.className="slide-next";nextBtn.type="button";nextBtn.textContent=n===slides.length-1?"В начало":"Далее →";nextBtn.onclick=()=>show(n===slides.length-1?0:n+1);slide.appendChild(nextBtn)});
const dots=[...document.querySelectorAll(".dot")];
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle("active",n===current));dots.forEach((d,n)=>d.classList.toggle("active",n===current));bar.style.width=((current+1)/slides.length*100)+"%";mobilePrev.disabled=current===0;mobileNext.disabled=current===slides.length-1}
mobilePrev.onclick=()=>show(current-1);mobileNext.onclick=()=>show(current+1);
function toggleFullScreen(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}
document.addEventListener("keydown",e=>{if(imageModal.open)return;const typing=["INPUT","TEXTAREA"].includes(document.activeElement.tagName);if(!typing&&["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==="f")toggleFullScreen()});
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const recallBank=[
{q:"Какое событие 1956 года закрепило название «искусственный интеллект»?",a:"Дартмутский семинар",w:["Создание первого смартфона","Появление интернета","Запуск ChatGPT"]},
{q:"Что проверяет тест Тьюринга?",a:"Можно ли в диалоге отличить ответы машины от ответов человека",w:["Скорость вычислений компьютера","Объём памяти программы","Умеет ли робот самостоятельно двигаться"]},
{q:"Что называют «зимой искусственного интеллекта»?",a:"Период снижения интереса и финансирования из-за несбывшихся ожиданий",w:["Запрет компьютеров в холодное время года","Этап, когда ИИ работал только с прогнозом погоды","Период полного исчезновения исследований ИИ"]},
{q:"Почему данные стали одним из двигателей современного ИИ?",a:"Большие наборы примеров позволяют моделям находить сложные закономерности",w:["Данные полностью заменили алгоритмы","Чем больше файлов, тем любой ответ автоматически вернее","Данные нужны только для хранения результатов"]},
{q:"Как вычислительные мощности повлияли на развитие ИИ?",a:"Позволили быстрее обучать более сложные модели",w:["Сделали обучающие данные ненужными","Автоматически устранили все ошибки моделей","Заменили необходимость в алгоритмах"]},
{q:"Почему системы вроде ChatGPT стали возможны именно сейчас?",a:"Совместились большие данные, новые алгоритмы и мощные вычисления",w:["Появилось одно универсальное правило для всех вопросов","Компьютеры научились работать без обучения","Причиной стало только увеличение скорости интернета"]}
];
let recallOrder=[],recallIndex=0,recallPoints=0,recallLocked=false;
function renderRecall(){const item=recallOrder[recallIndex];recallLocked=false;recallCount.textContent="Вопрос "+(recallIndex+1)+" / 6";recallScore.textContent="Верно: "+recallPoints;recallQuestion.textContent=item.q;recallFeedback.textContent="Выберите наиболее точный ответ.";recallNext.hidden=true;recallOptions.innerHTML="";shuffle([item.a,...item.w]).forEach(text=>{const b=document.createElement("button");b.className="quizoption";b.textContent=text;b.onclick=()=>answerRecall(b,item);recallOptions.appendChild(b)})}
function answerRecall(button,item){if(recallLocked)return;recallLocked=true;const ok=button.textContent===item.a;if(ok)recallPoints++;document.querySelectorAll(".quizoption").forEach(b=>{b.disabled=true;if(b.textContent===item.a)b.classList.add("correct")});if(!ok)button.classList.add("wrong");recallScore.textContent="Верно: "+recallPoints;recallFeedback.textContent=ok?"Верно!":"Зелёным отмечен точный ответ.";recallNext.hidden=false;recallNext.textContent=recallIndex===5?"Завершить тест":"Следующий →"}
function finishRecall(){recallCount.textContent="Тест завершён";recallScore.textContent="Результат: "+recallPoints+" / 6";recallQuestion.textContent=recallPoints>=5?"История ИИ усвоена — двигаемся дальше!":recallPoints>=3?"Неплохо. Обсудите ошибки перед новой темой.":"Повторите ключевые этапы развития ИИ.";recallOptions.innerHTML="";recallFeedback.textContent="";recallNext.hidden=false;recallNext.textContent="Пройти ещё раз ↻";recallNext.onclick=startRecall}
function nextRecall(){if(recallIndex<5){recallIndex++;renderRecall()}else finishRecall()}
function startRecall(){recallOrder=shuffle([...recallBank]);recallIndex=0;recallPoints=0;recallNext.onclick=nextRecall;renderRecall()}
document.querySelectorAll(".pipe").forEach(pipe=>pipe.onclick=()=>{document.querySelectorAll(".pipe").forEach(x=>x.classList.remove("active"));pipe.classList.add("active");pipeInfo.textContent=pipe.dataset.info});
let trained=false;
trainModel.onclick=()=>{trained=!trained;trainChart.classList.toggle("untrained",!trained);[step1,step2,step3].forEach(x=>x.classList.remove("active"));if(trained){step3.classList.add("active");errorBadge.textContent="Ошибка: уменьшилась";trainModel.textContent="Сбросить обучение"}else{step1.classList.add("active");errorBadge.textContent="Ошибка: большая";trainModel.textContent="Обучить модель"}};
document.querySelectorAll(".task .choice").forEach(choice=>choice.onclick=()=>{choice.closest(".choices").querySelectorAll(".choice").forEach(x=>x.classList.remove("selected"));choice.classList.add("selected");choice.closest(".task").classList.remove("correct","wrong")});
checkMission.onclick=()=>{let score=0,answered=0;document.querySelectorAll(".task").forEach(task=>{const selected=task.querySelector(".selected");task.classList.remove("correct","wrong");if(!selected)return;answered++;const ok=selected.dataset.value===task.dataset.answer;task.classList.add(ok?"correct":"wrong");if(ok)score+=2});missionScore.textContent="Результат: "+score+" / 10";missionFeedback.textContent=answered<5?"Ответьте ещё на "+(5-answered)+" задан.":score>=9?"Отлично: понятия связаны верно!":score>=7?"Хорошо. Проверьте одну неточность.":score>=5?"Основа есть — повторите конвейер.":"Вернитесь к объяснению и попробуйте снова."};
resetMission.onclick=()=>{document.querySelectorAll(".task").forEach(x=>x.classList.remove("correct","wrong"));document.querySelectorAll(".task .choice").forEach(x=>x.classList.remove("selected"));missionScore.textContent="Результат: — / 10";missionFeedback.textContent=""};
startRecall();show(Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1)));
  };

  /* Lesson 10ogn-3 (10 ОГН - 3 урок) */
  LESSON_SCRIPTS['10ogn-3'] = function() {
const slides=[...document.querySelectorAll(".slide")],progress=document.getElementById("progress"),dots=document.getElementById("dots");let current=0;
const dotLabels=["Старт","Вход в тему","Три парадигмы","С учителем","Без учителя","С подкреплением","Сравнение","Практика","Оценивание"];
slides.forEach((slide,n)=>{const dot=document.createElement("button");dot.className="dot";dot.type="button";dot.dataset.label=dotLabels[n]||`Слайд ${n+1}`;dot.title=dot.dataset.label;dot.setAttribute("aria-label","Перейти к слайду: "+dot.dataset.label);dot.onclick=()=>show(n);dots.appendChild(dot);const next=document.createElement("button");next.className="slide-next";next.type="button";next.textContent=n===slides.length-1?"В начало":"Далее →";next.onclick=()=>show(n===slides.length-1?0:n+1);slide.appendChild(next)});
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>{s.classList.toggle("active",n===current);const eyebrow=s.querySelector(".eyebrow");if(eyebrow&&n>0){const title=eyebrow.textContent.replace(/^\d{2}\s*·\s*/,"");eyebrow.textContent=String(n+1).padStart(2,"0")+" · "+title}});[...dots.children].forEach((d,n)=>d.classList.toggle("active",n===current));progress.style.width=((current+1)/slides.length*100)+"%";mobilePrev.disabled=current===0;mobileNext.disabled=current===slides.length-1;location.hash=current+1}
mobilePrev.onclick=()=>show(current-1);mobileNext.onclick=()=>show(current+1);
function full(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}
document.addEventListener("keydown",e=>{if(!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)&&["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();show(current+1)}if(!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)&&["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();show(current-1)}if(e.key.toLowerCase()==="f")full()});
document.querySelectorAll(".task .choice").forEach(choice=>choice.onclick=()=>{const task=choice.closest(".task");task.querySelectorAll(".choice").forEach(x=>x.classList.remove("selected"));choice.classList.add("selected");task.classList.remove("correct","wrong")});
const check=document.getElementById("check");if(check)check.onclick=()=>{let score=0,answered=0;document.querySelectorAll(".task").forEach(task=>{const selected=task.querySelector(".selected");task.classList.remove("correct","wrong");if(!selected)return;answered++;const ok=selected.dataset.value===task.dataset.answer;task.classList.add(ok?"correct":"wrong");if(ok)score+=2});document.getElementById("score").textContent="Результат: "+score+" / 10";document.getElementById("feedback").textContent=answered<5?"Ответьте ещё на "+(5-answered)+" задан.":score===10?"Безошибочно — цель урока достигнута!":score>=7?"Хорошо. Проверьте маркеры в ошибочных кейсах.":"Повторите таблицу сравнения и попробуйте снова."};
const reset=document.getElementById("reset");if(reset)reset.onclick=()=>{document.querySelectorAll(".task").forEach(t=>t.classList.remove("correct","wrong"));document.querySelectorAll(".choice").forEach(c=>c.classList.remove("selected"));document.getElementById("score").textContent="Результат: — / 10";document.getElementById("feedback").textContent=""};
const practiceButtons=[...document.querySelectorAll(".practice-done")],practiceResult=document.getElementById("practiceResult");practiceButtons.forEach(button=>button.onclick=()=>{const card=button.closest(".practice-card");card.classList.toggle("done");button.textContent=card.classList.contains("done")?"Выполнено ✓":"Отметить выполнение";const completed=document.querySelectorAll(".practice-card.done").length;practiceResult.innerHTML="<strong>Результат практики:</strong> выполнено "+completed+" из 3 примеров. "+(completed===3?"Все варианты разобраны — сравните, какие исходные данные были в каждом примере.":"Завершите выбранный разбор в тетради и отметьте его кнопкой.")});
show(Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1)));
const movingSpheres=[...document.querySelectorAll(".bg-sphere")].map((element,index)=>({element,index}));
function animateSpheres(time){movingSpheres.forEach(({element,index})=>{const phase=time/1000*(.22+index*.045)+index*1.7;const x=Math.sin(phase)*([82,96,128,72][index]);const y=Math.cos(phase*.83)*([58,88,105,64][index]);const scale=1+Math.sin(phase*.7+index)*.07;element.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`});requestAnimationFrame(animateSpheres)}
requestAnimationFrame(animateSpheres);
  };

  /* Lesson 10ogn-4 (10 ОГН - 4 урок) */
  LESSON_SCRIPTS['10ogn-4'] = function() {
const slides=[...document.querySelectorAll('.slide')],dots=document.getElementById('dots'),progress=document.getElementById('progress');let current=0;
const labels=['1 · Старт','2 · Результат','3 · Темы','4 · Содержание','5 · Дескриптор','6 · Итог'];
labels.forEach((label,i)=>{const b=document.createElement('button');b.className='dot';b.dataset.label=label;b.onclick=()=>show(i);dots.appendChild(b)});
function alignNext(){const badge=document.querySelector('.slide.active .eyebrow'),next=document.getElementById('next');if(badge&&next)next.style.top=Math.max(18,badge.getBoundingClientRect().top)+'px'}
function show(i){current=Math.max(0,Math.min(slides.length-1,i));slides.forEach((s,n)=>s.classList.toggle('active',n===current));[...dots.children].forEach((d,n)=>d.classList.toggle('active',n===current));progress.style.width=((current+1)/slides.length*100)+'%';document.getElementById('next').textContent=current===slides.length-1?'Начать заново →':'Следующий слайд →';document.getElementById('prev').disabled=current===0;requestAnimationFrame(()=>{alignNext();setTimeout(alignNext,450)})}
function step(n){show(current===slides.length-1&&n>0?0:current+n)}document.getElementById('next').onclick=()=>step(1);document.getElementById('prev').onclick=()=>step(-1);document.getElementById('mnext').onclick=()=>step(1);document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')step(1);if(e.key==='ArrowLeft')step(-1)});show(0);
window.addEventListener('resize',alignNext);document.querySelectorAll('#topics .choice').forEach(button=>button.onclick=()=>{document.querySelectorAll('#topics .choice').forEach(x=>x.classList.remove('selected'));button.classList.add('selected');document.getElementById('topicResponse').textContent='Выбрано: '+button.querySelector('strong').textContent+' Теперь сформулируйте главный вопрос одним предложением.'});
  };

  /* Lesson 10ogn-5 (10 ОГН - 5 урок) */
  LESSON_SCRIPTS['10ogn-5'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),slideNext=document.getElementById('slideNext'),dotLabels=['01 · Старт','02 · Машинное обучение','03 · Структура','04 · Взвешенная сумма','05 · Функция активации','06 · Ограничения','07 · Практика','08 · Оценивание'];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));const activeSlide=slides[current];requestAnimationFrame(()=>activeSlide.getAnimations({subtree:true}).forEach(animation=>{animation.cancel();animation.play()}));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1;slideNext.textContent=current===slides.length-1?'Начать заново →':'Следующий слайд →'}prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);slideNext.onclick=()=>show(current===slides.length-1?0:current+1);
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
document.querySelectorAll('.click-node,.click-sum,.click-activation,.weight-badge').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.click-node,.click-sum,.click-activation,.weight-badge').forEach(item=>item.classList.remove('active'));button.classList.add('active');document.getElementById('clickInfo').innerHTML=button.dataset.info}));
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
  };

  /* Lesson 10ogn-6 (10 ОГН - 6 урок) */
  LESSON_SCRIPTS['10ogn-6'] = function() {
const slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('progress'),dotsNav=document.getElementById('dotsNav'),slideNext=document.getElementById('slideNext'),dotLabels=['01 · Старт','02 · Повторение','03 · Практика','04 · Excel','05 · Итог и дескрипторы'];let current=0;
slides.forEach((slide,n)=>{const dot=document.createElement('button');dot.className='dot';dot.type='button';dot.title=dotLabels[n];dot.setAttribute('aria-label','Перейти к слайду: '+dotLabels[n]);dot.onclick=()=>show(n);dotsNav.appendChild(dot)});const dots=[...document.querySelectorAll('.dot')],prev=document.getElementById('mobilePrev'),next=document.getElementById('mobileNext');
function show(i){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current));bar.style.width=((current+1)/slides.length*100)+'%';prev.disabled=current===0;next.disabled=current===slides.length-1;slideNext.textContent=current===slides.length-1?'Начать заново →':'Следующий слайд →';requestAnimationFrame(()=>{alignNext();setTimeout(alignNext,470)});if(slides[current].classList.contains('excel-slide'))window.getSelection()?.removeAllRanges()}function alignNext(){const badge=slides[current].querySelector('.eyebrow');if(badge&&getComputedStyle(slideNext).display!=='none')slideNext.style.top=Math.max(18,badge.getBoundingClientRect().top)+'px'}addEventListener('resize',alignNext);prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);slideNext.onclick=()=>show(current===slides.length-1?0:current+1);
// Classroom restriction for the Excel slide only; normal navigation remains available.
const excelSlide=document.querySelector('.excel-slide');
['selectstart','dragstart','contextmenu'].forEach(type=>excelSlide.addEventListener(type,e=>e.preventDefault()));
['copy','cut'].forEach(type=>document.addEventListener(type,e=>{if(excelSlide.classList.contains('active'))e.preventDefault()}));
document.addEventListener('keydown',e=>{
if(!excelSlide.classList.contains('active'))return;
const command=e.ctrlKey||e.metaKey;
if((command&&(['KeyA','KeyC','KeyX'].includes(e.code)||['a','c','x'].includes(e.key.toLowerCase())))||(e.ctrlKey&&e.key==='Insert')||(e.shiftKey&&e.key==='Delete'))e.preventDefault();
});
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement.tagName);if(!typing&&['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1)}if(!typing&&['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1)}if(!typing&&e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});
// Схема перцептрона: блоки можно ставить в любое поле, правильность видна только после «Проверить».
let held=null;
const chips=[...document.querySelectorAll('.chip')],zones=[...document.querySelectorAll('.drop-zone')],experience=document.getElementById('recallExperience'),status=document.getElementById('recallStatus');
const elementZones=zones.filter(z=>z.dataset.set==='element'),roleZones=zones.filter(z=>z.dataset.set==='description');
const trays={element:document.getElementById('elementTray'),description:document.getElementById('descTray')};
zones.forEach(z=>z.dataset.label=z.innerHTML);
function setEmpty(zone){zone.innerHTML=zone.dataset.label;zone.classList.remove('filled')}
function deselect(){held=null;chips.forEach(c=>c.classList.remove('selected'))}
function clearStatus(){status.textContent='';status.className='status'}
function isZone(el){return el&&el.classList.contains('drop-zone')}
function place(chip,zone){
  if(!chip||!zone||chip.classList.contains('locked')||chip.dataset.set!==zone.dataset.set)return;
  const from=chip.parentElement,existing=zone.querySelector('.chip');
  if(existing===chip){deselect();return}
  if(existing){if(isZone(from))from.append(existing);else trays[existing.dataset.set].append(existing)}
  else if(isZone(from))setEmpty(from);
  zone.innerHTML='';zone.append(chip);zone.classList.add('filled');deselect();clearStatus();
}
function toTray(chip){
  if(!chip||chip.classList.contains('locked'))return;
  const from=chip.parentElement;
  if(isZone(from)){trays[chip.dataset.set].append(chip);setEmpty(from);clearStatus()}
  deselect();
}
function shuffle(tray){[...tray.children].sort(()=>Math.random()-.5).forEach(c=>tray.append(c))}
chips.forEach(chip=>{
  chip.addEventListener('dragstart',e=>{if(chip.classList.contains('locked')){e.preventDefault();return}held=chip;e.dataTransfer.effectAllowed='move'});
  chip.addEventListener('dragend',()=>{if(held===chip&&!chip.classList.contains('selected'))held=null;zones.forEach(z=>z.classList.remove('drag-over'))});
  chip.addEventListener('click',e=>{
    e.stopPropagation();
    if(chip.classList.contains('locked'))return;
    if(held&&held!==chip&&isZone(chip.parentElement)&&held.dataset.set===chip.dataset.set){place(held,chip.parentElement);return}
    if(held===chip){deselect();return}
    held=chip;chips.forEach(c=>c.classList.toggle('selected',c===chip));
  });
});
zones.forEach(zone=>{
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');place(held,zone)});
  zone.addEventListener('click',()=>place(held,zone));
});
Object.values(trays).forEach(tray=>{
  tray.addEventListener('dragover',e=>e.preventDefault());
  tray.addEventListener('drop',e=>{e.preventDefault();if(held&&trays[held.dataset.set]===tray)toTray(held)});
  tray.addEventListener('click',()=>{if(held&&trays[held.dataset.set]===tray)toTray(held)});
});
function countCorrect(list){return list.filter(z=>z.querySelector('.chip')?.dataset.kind===z.dataset.kind).length}
function lockSet(list){list.forEach(z=>{z.classList.add('right');const c=z.querySelector('.chip');if(c){c.classList.add('locked');c.draggable=false}})}
document.getElementById('checkRecall').onclick=()=>{
  const roles=experience.classList.contains('roles-unlocked'),list=roles?roleZones:elementZones;
  if(!list.every(z=>z.querySelector('.chip'))){status.textContent=roles?'Распределите все роли под элементами схемы.':'Сначала расставьте все элементы схемы.';status.className='status bad';return}
  const ok=countCorrect(list);
  if(ok<list.length){status.textContent='Верно '+ok+' из '+list.length+'. Подумайте и переставьте блоки.';status.className='status bad';return}
  lockSet(list);
  if(!roles){experience.classList.add('roles-unlocked');status.textContent='Схема собрана верно! Теперь распределите роли.';status.className='status ok'}
  else{status.textContent='Верно! Схема и роли собраны.';status.className='status ok'}
};
document.getElementById('resetRecall').onclick=()=>{
  chips.forEach(c=>{c.classList.remove('locked','selected');c.draggable=true;trays[c.dataset.set].append(c)});
  zones.forEach(z=>{setEmpty(z);z.classList.remove('right')});
  Object.values(trays).forEach(shuffle);
  experience.classList.remove('roles-unlocked');deselect();clearStatus();
};
Object.values(trays).forEach(shuffle);
// Случайные значения для практической работы (слайд 3)
(function initRandomTask(){
  const ti=document.getElementById('taskInputs'),tw=document.getElementById('taskWeights');
  if(!ti||!tw)return;
  // x: 0 или 1 (не все нули)
  let x1,x2,x3;
  do{x1=Math.random()<.5?0:1;x2=Math.random()<.5?0:1;x3=Math.random()<.5?0:1}while(x1===0&&x2===0&&x3===0);
  ti.textContent=`x₁=${x1}, x₂=${x2}, x₃=${x3}`;
  // w: веса от 0,1 до 0,9 с одним знаком после запятой
  const wPool=[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9].sort(()=>Math.random()-.5);
  const fmt=n=>n.toFixed(1).replace('.',',');
  tw.textContent=`w₁=${fmt(wPool[0])}, w₂=${fmt(wPool[1])}, w₃=${fmt(wPool[2])}`;
})();
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let points=[];function init(){canvas.width=innerWidth;canvas.height=innerHeight;points=Array.from({length:48},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*2}))}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(124,77,255,.09)';points.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle='rgba(81,196,166,.18)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();for(let j=i+1;j<points.length;j++){const q=points[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<145){ctx.globalAlpha=1-d/145;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.globalAlpha=1}}});requestAnimationFrame(draw)}addEventListener('resize',init);init();draw();show(0);
  };

  /* Lesson 11-1 (11 класс - 1 урок) */
  LESSON_SCRIPTS['11-1'] = function() {
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.getElementById('dots');
        const totalSlides = slides.length;

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(i);
            dotsContainer.appendChild(dot);
        });

        const nextButtonLabels = [
            '',
            'К архитектуре',
            'К примерам',
            'К Quick, Draw!',
            'К Moral Machine',
            'К фактам',
            'В начало'
        ];

        slides.forEach((slide, i) => {
            if (i === 0) return;

            const container = slide.querySelector('.container');
            if (!container) return;

            const actionRow = document.createElement('div');
            actionRow.className = 'slide-action-row';

            const button = document.createElement('button');
            button.className = 'nav-btn start-btn slide-next-btn';
            button.type = 'button';
            button.innerHTML = `${nextButtonLabels[i] || 'Дальше'} <i class="fas fa-arrow-right"></i>`;
            button.onclick = () => {
                if (i === totalSlides - 1) {
                    goToSlide(0);
                    return;
                }
                changeSlide(1);
            };

            actionRow.appendChild(button);
            container.appendChild(actionRow);
        });

        function updateUI() {
            slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
            document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
            document.getElementById('progress').style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }

        function changeSlide(dir) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + dir));
            updateUI();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateUI();
        }

        // Output probabilities on the architecture slide
        const catProb = document.getElementById('cat-prob');
        const dogProb = document.getElementById('dog-prob');
        const catFill = document.getElementById('cat-fill');
        const dogFill = document.getElementById('dog-fill');
        let probTick = 0;

        function updateProbabilities() {
            if (!catProb || !dogProb || !catFill || !dogFill) return;

            probTick += 0.08;
            const cat = Math.round(58 + Math.sin(probTick) * 17 + Math.sin(probTick * 0.37) * 6);
            const clampedCat = Math.max(35, Math.min(82, cat));
            const dog = 100 - clampedCat;

            catProb.textContent = `${clampedCat}%`;
            dogProb.textContent = `${dog}%`;
            catFill.style.width = `${clampedCat}%`;
            dogFill.style.width = `${dog}%`;
        }

        updateProbabilities();
        setInterval(updateProbabilities, 700);

        // Background Animation
        const canvas = document.getElementById('network-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for(let i=0; i<50; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
        }

        function draw() {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
            ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
            
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
                ctx.fill();

                for(let j=i+1; j<particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if(dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initParticles);
        initParticles();
        draw();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowRight') changeSlide(1);
            if(e.key === 'ArrowLeft') changeSlide(-1);
        });
  };

  /* Lesson 11-2 (11 класс - 2 урок) */
  LESSON_SCRIPTS['11-2'] = function() {
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const dotsNav = document.getElementById('dotsNav');
        const totalSlides = slides.length;

        // Init Dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `dot-nav ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(i);
            dotsNav.appendChild(dot);
        });

        function updateUI() {
            slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
            document.querySelectorAll('.dot-nav').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
            document.getElementById('progress').style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
            document.getElementById('prevBtn').disabled = currentSlide === 0;
            document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
        }

        function changeSlide(dir) {
            currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + dir));
            updateUI();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateUI();
        }

        function checkAnswer(el, type) {
            const feedback = document.getElementById('quiz-feedback');
            el.style.borderColor = 'var(--success)';
            el.style.background = 'rgba(16, 185, 129, 0.1)';
            
            let typeName = "";
            if(type === 'reg') typeName = "Регрессия (число)";
            if(type === 'class') typeName = "Классификация (категория)";
            if(type === 'rec') typeName = "Распознавание (образ)";
            
            feedback.innerHTML = `<span style="color: var(--success)">Верно! Это ${typeName}</span>`;
        }

        // Background particles (same as lesson 1 for consistency)
        const canvas = document.getElementById('network-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for(let i=0; i<40; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3
                });
            }
        }

        function draw() {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.05)';
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
                for(let j=i+1; j<particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if(dist < 200) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initParticles);
        initParticles();
        draw();

        document.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowRight') changeSlide(1);
            if(e.key === 'ArrowLeft') changeSlide(-1);
        });
  };

  /* Lesson 11-3 (11 класс - 3 урок) */
  LESSON_SCRIPTS['11-3'] = function() {
'use strict';
let currentSlide=0;
const slides=[...document.querySelectorAll('.slide')].slice(0,4);
const titles=[...document.querySelectorAll('h1,h2')].map(h=>h.textContent);
const dotsNav=document.getElementById('dotsNav');
slides.forEach((slide,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='dot-nav';dot.setAttribute('aria-label',`Слайд ${i+1}: ${titles[i]}`);dot.addEventListener('click',()=>goToSlide(i));dotsNav.appendChild(dot);});
function updateUI(){slides.forEach((slide,i)=>{slide.classList.toggle('active',i===currentSlide);slide.setAttribute('aria-hidden',String(i!==currentSlide));});[...dotsNav.children].forEach((dot,i)=>{dot.classList.toggle('active',i===currentSlide);if(i===currentSlide)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');});document.getElementById('progress').style.width=`${(currentSlide+1)/slides.length*100}%`;document.getElementById('counter').textContent=`${currentSlide+1} / ${slides.length}`;document.getElementById('prevBtn').disabled=currentSlide===0;document.getElementById('nextBtn').disabled=currentSlide===slides.length-1;}
function goToSlide(i){currentSlide=Math.max(0,Math.min(slides.length-1,i));updateUI();slides[currentSlide].scrollTop=0;}
function changeSlide(dir){goToSlide(currentSlide+dir);}
document.getElementById('prevBtn').addEventListener('click',()=>changeSlide(-1));document.getElementById('nextBtn').addEventListener('click',()=>changeSlide(1));
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'){e.preventDefault();changeSlide(1);}if(e.key==='ArrowLeft'){e.preventDefault();changeSlide(-1);}if(e.key==='Home')goToSlide(0);if(e.key==='End')goToSlide(slides.length-1);});
const options=[['','Выберите технологию'],['cv','CV — компьютерное зрение'],['nlp','NLP — обработка языка'],['gen','GenAI — генеративный ИИ'],['stt','STT — распознавание речи'],['tts','TTS — синтез речи']];
function fillOptions(select){options.forEach(([value,label])=>select.add(new Option(label,value)));}
const matchData=[['Логистика: камера находит вмятины на коробках.','cv','Система анализирует изображение упаковки.'],['Торговля: система определяет тему письменной жалобы.','nlp','Система анализирует смысл текста.'],['Дизайн: сервис создаёт эскиз логотипа по описанию.','gen','Система создаёт новое изображение.'],['Медиа: сервис записывает интервью текстом из аудио.','stt','Вход — речь, выход — текст.'],['Транспорт: помощник читает вслух готовое уведомление.','tts','Вход — текст, выход — речь.']];
const decompData=[['1. Превращает голос клиента в текст.','stt','Этот шаг записывает произнесённые слова.'],['2. Определяет, что клиент хочет заблокировать карту.','nlp','Этот шаг определяет намерение по тексту.'],['3. Произносит готовую инструкцию.','tts','Этот шаг озвучивает текст ответа.']];
function createPractice(hostId,formId,resultId,data){const host=document.getElementById(hostId);data.forEach(([prompt],i)=>{const row=document.createElement('div');row.className='match-row';const label=document.createElement('label');label.htmlFor=`${hostId}-${i}`;label.textContent=prompt;const select=document.createElement('select');select.id=label.htmlFor;fillOptions(select);const feedback=document.createElement('p');feedback.className='feedback';feedback.id=`${select.id}-feedback`;select.setAttribute('aria-describedby',feedback.id);row.append(label,select,feedback);host.appendChild(row);select.addEventListener('change',()=>{feedback.textContent='';feedback.className='feedback';select.removeAttribute('aria-invalid');document.getElementById(resultId).textContent='';});});document.getElementById(formId).addEventListener('submit',e=>{e.preventDefault();let correct=0,filled=0;[...host.children].forEach((row,i)=>{const select=row.querySelector('select'),feedback=row.querySelector('.feedback');const ok=select.value===data[i][1];if(select.value)filled++;if(ok)correct++;feedback.className=`feedback ${ok?'correct':'incorrect'}`;feedback.textContent=!select.value?'Выбери технологию.':ok?`Верно. ${data[i][2]}`:'Пока неверно. Сравни входные данные и требуемый результат; попробуй ещё раз.';select.setAttribute('aria-invalid',String(!ok));});document.getElementById(resultId).textContent=filled<data.length?`Заполнено ${filled} из ${data.length}. Верно: ${correct}.`:`Верно: ${correct} из ${data.length}. ${correct===data.length?'Теперь объясни выбор своими словами.':'Исправь отмеченные ответы и проверь снова.'}`;});}
createPractice('matchItems','matching','matchResult',matchData);createPractice('decompItems','decomposition','decompResult',decompData);fillOptions(document.getElementById('exitTech'));
document.getElementById('exitTech').addEventListener('change',()=>{document.getElementById('exitResult').textContent='';});
document.getElementById('exitCheck').addEventListener('click',()=>{const value=document.getElementById('exitTech').value;const result=document.getElementById('exitResult');result.className=`result ${value==='cv'?'correct':'incorrect'}`;result.textContent=!value?'Сначала выбери технологию.':value==='cv'?'Верно: CV анализирует изображение и находит повреждения. Назови сферу применения.':'Подумай: сервис анализирует готовое фото или создаёт новый контент? Попробуй ещё раз.';});
const canvas=document.getElementById('network-bg'),ctx=canvas.getContext('2d');let particles=[];
function initParticles(){canvas.width=innerWidth;canvas.height=innerHeight;particles=Array.from({length:35},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.9,vy:(Math.random()-.5)*.9,radius:Math.random()*1.5+1}));drawBackground(false);}
function drawBackground(move){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach((p,i)=>{if(move){p.x+=p.vx;p.y+=p.vy;if(p.x<-30)p.x=canvas.width+30;if(p.x>canvas.width+30)p.x=-30;if(p.y<-30)p.y=canvas.height+30;if(p.y>canvas.height+30)p.y=-30;}particles.slice(i+1).forEach(q=>{const distance=Math.hypot(p.x-q.x,p.y-q.y);if(distance<190){ctx.strokeStyle=`rgba(244,63,94,${.12*(1-distance/190)})`;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}});ctx.fillStyle='rgba(244,63,94,.2)';ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();});}
function animate(){if(!document.hidden)drawBackground(true);requestAnimationFrame(animate);}window.addEventListener('resize',initParticles);initParticles();animate();updateUI();
  };

  /* Lesson 11-4 (11 класс - 4 урок) */
  LESSON_SCRIPTS['11-4'] = function() {
'use strict';

      const slides = [...document.querySelectorAll('.slide')];
      const dotsNav = document.getElementById('dotsNav');
      const progress = document.getElementById('progress');
      const counter = document.getElementById('counter');
      const prevButton = document.getElementById('prevBtn');
      const nextButton = document.getElementById('nextBtn');
      let currentSlide = 0;

      slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        const title = slide.querySelector('h1, h2').textContent;
        dot.type = 'button';
        dot.className = 'dot-nav';
        dot.title = `Слайд ${index + 1}: ${title}`;
        dot.setAttribute('aria-label', dot.title);
        dot.addEventListener('click', () => goToSlide(index));
        dotsNav.append(dot);
      });

      function goToSlide(index) {
        currentSlide = Math.max(0, Math.min(slides.length - 1, index));
        slides.forEach((slide, number) => {
          const active = number === currentSlide;
          slide.classList.toggle('active', active);
          slide.setAttribute('aria-hidden', String(!active));
          slide.querySelectorAll('video').forEach(video => {
            if (active) video.play().catch(() => {});
            else video.pause();
          });
        });
        [...dotsNav.children].forEach((dot, number) => {
          const active = number === currentSlide;
          dot.classList.toggle('active', active);
          if (active) dot.setAttribute('aria-current', 'step');
          else dot.removeAttribute('aria-current');
        });
        progress.style.width = `${(currentSlide + 1) / slides.length * 100}%`;
        counter.textContent = `${currentSlide + 1} / ${slides.length}`;
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === slides.length - 1;
        slides[currentSlide].scrollTop = 0;
        history.replaceState(null, '', `#${currentSlide + 1}`);
      }

      function goToHash() {
        const match = /^#([1-4])$/.exec(location.hash);
        goToSlide(match ? Number(match[1]) - 1 : 0);
      }

      prevButton.addEventListener('click', () => goToSlide(currentSlide - 1));
      nextButton.addEventListener('click', () => goToSlide(currentSlide + 1));
      document.getElementById('startBtn').addEventListener('click', () => goToSlide(1));
      window.addEventListener('hashchange', goToHash);
      document.addEventListener('keydown', event => {
        if (event.target.closest('input, textarea, select, button, a, summary, video, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return;
        const destinations = {
          ArrowRight: currentSlide + 1,
          PageDown: currentSlide + 1,
          ArrowLeft: currentSlide - 1,
          PageUp: currentSlide - 1,
          Home: 0,
          End: slides.length - 1
        };
        if (Object.hasOwn(destinations, event.key)) {
          event.preventDefault();
          goToSlide(destinations[event.key]);
        }
      });

      const canvas = document.getElementById('network-bg');
      const ctx = canvas.getContext('2d');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      let particles = [];
      let animationFrame = null;

      function initParticles() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        particles = Array.from({length: 35}, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - .5) * .9,
          vy: (Math.random() - .5) * .9,
          radius: Math.random() * 1.5 + 1
        }));
        drawBackground(false);
      }

      function drawBackground(move) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle, index) => {
          if (move) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.x < -30) particle.x = canvas.width + 30;
            if (particle.x > canvas.width + 30) particle.x = -30;
            if (particle.y < -30) particle.y = canvas.height + 30;
            if (particle.y > canvas.height + 30) particle.y = -30;
          }
          particles.slice(index + 1).forEach(other => {
            const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
            if (distance < 190) {
              ctx.strokeStyle = `rgba(244, 63, 94, ${.12 * (1 - distance / 190)})`;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          });
          ctx.fillStyle = 'rgba(244, 63, 94, .2)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      function animate() {
        animationFrame = null;
        if (document.hidden || reducedMotion.matches) return;
        drawBackground(true);
        animationFrame = requestAnimationFrame(animate);
      }

      function updateAnimation() {
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        animationFrame = null;
        if (!document.hidden && !reducedMotion.matches) animate();
        else drawBackground(false);
      }

      window.addEventListener('resize', initParticles);
      document.addEventListener('visibilitychange', updateAnimation);
      reducedMotion.addEventListener('change', updateAnimation);
      initParticles();
      updateAnimation();
      goToHash();
  };

  /* Lesson 11-5 (11 класс - 5 урок) */
  LESSON_SCRIPTS['11-5'] = function() {
'use strict';

    const slides = [...document.querySelectorAll('.slide')];
    const dotsNav = document.getElementById('dotsNav');
    const progress = document.getElementById('progress');
    const counter = document.getElementById('counter');
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');
    const modelForm = document.getElementById('model-form');
    const modelStatus = document.getElementById('model-status');
    const cameraStatus = document.getElementById('camera-status');
    const downloadSlideButton = document.getElementById('download-slide');
    const loadModelButton = document.getElementById('load-model');
    const cameraButton = document.getElementById('camera-button');
    const stopButton = document.getElementById('stop-button');
    const webcamContainer = document.getElementById('webcam-container');
    const threshold = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const predictionLabel = document.getElementById('prediction-label');
    const actionLabel = document.getElementById('action-label');
    const confidence = document.getElementById('confidence');
    const confidenceMeter = document.getElementById('confidence-meter');
    const confidenceProgress = document.querySelector('.meter[role="progressbar"]');
    const audioPlayer = document.getElementById('audio-player');
    const audioStatus = document.getElementById('audio-status');
    const volumeControl = document.getElementById('volume-control');
    const volumeValue = document.getElementById('volume-value');
    const audioFile = document.getElementById('audio-file');
    const dinoModelForm = document.getElementById('dino-model-form');
    const dinoModelStatus = document.getElementById('dino-model-status');
    const dinoLoadModelButton = document.getElementById('dino-load-model');
    const dinoCameraButton = document.getElementById('dino-camera-button');
    const dinoStopCameraButton = document.getElementById('dino-stop-camera');
    const dinoWebcamContainer = document.getElementById('dino-webcam-container');
    const dinoThreshold = document.getElementById('dino-threshold');
    const dinoThresholdValue = document.getElementById('dino-threshold-value');
    const dinoPredictionLabel = document.getElementById('dino-prediction-label');
    const dinoActionLabel = document.getElementById('dino-action-label');
    const dinoConfidence = document.getElementById('dino-confidence');
    const dinoGameCanvas = document.getElementById('dino-game');
    const dinoGameContext = dinoGameCanvas.getContext('2d');
    const dinoGameStatus = document.getElementById('dino-game-status');
    const dinoScoreOutput = document.getElementById('dino-score');
    const downloadDinoSlideButton = document.getElementById('download-dino-slide');
    const mappingSelects = {
      up: document.getElementById('map-up'),
      down: document.getElementById('map-down'),
      play: document.getElementById('map-play'),
      pause: document.getElementById('map-pause'),
      forward: document.getElementById('map-forward'),
      back: document.getElementById('map-back'),
      neutral: document.getElementById('map-neutral')
    };
    const dinoMappingSelects = {
      start: document.getElementById('dino-map-start'),
      stop: document.getElementById('dino-map-stop'),
      jump: document.getElementById('dino-map-jump'),
      duck: document.getElementById('dino-map-duck'),
      neutral: document.getElementById('dino-map-neutral')
    };

    let currentSlide = 0;
    let model = null;
    let cameraStream = null;
    let cameraVideo = null;
    let cameraStartPending = false;
    let cameraRequestId = 0;
    let inferenceRunning = false;
    let lastActionClass = null;
    let currentAudioUrl = null;
    let dinoModel = null;
    let dinoCameraStream = null;
    let dinoCameraVideo = null;
    let dinoCameraStartPending = false;
    let dinoCameraRequestId = 0;
    let dinoInferenceRunning = false;
    let lastDinoActionClass = null;
    let dinoAnimationFrame = null;
    let dinoLastFrame = 0;
    let dinoGameState = 'ready';
    let dinoScore = 0;
    let dinoObstacleX = dinoGameCanvas.width - 70;
    let dinoJumpUntil = 0;
    let dinoDuckUntil = 0;
    const defaultAudioUrl = audioPlayer.getAttribute('src');

    function setStatus(element, message, kind) {
      element.textContent = message;
      element.dataset.kind = kind || '';
    }

    function isCameraAllowedByFramePolicy() {
      const policy = document.permissionsPolicy || document.featurePolicy;
      return !policy || typeof policy.allowsFeature !== 'function' || policy.allowsFeature('camera');
    }

    function downloadAndOpenSlide(slideNumber) {
      const isDinoSlide = slideNumber === 5;
      const exportStatus = isDinoSlide ? document.getElementById('dino-camera-status') : cameraStatus;
      const exportMappingSelects = isDinoSlide ? dinoMappingSelects : mappingSelects;
      let standaloneWindow = null;
      let openError = '';
      try {
        standaloneWindow = window.open('about:blank', '_blank');
      } catch (error) {
        openError = error instanceof Error ? error.message : String(error);
      }
      const exportedDocument = document.documentElement.cloneNode(true);
      exportedDocument.querySelector('title').textContent = isDinoSlide
        ? 'Игра Динозаврик под управлением жестами · Урок 5'
        : 'AI-панель управления жестами · Урок 5';
      const modelUrlSelector = isDinoSlide ? '#dino-model-url' : '#model-url';
      const modelUrlInput = exportedDocument.querySelector(modelUrlSelector);
      modelUrlInput.setAttribute('value', document.querySelector(modelUrlSelector).value);

      const exportedMappingSelector = isDinoSlide ? '.dino-layout .mapping-grid select' : '.panel-content .mapping-grid select';
      exportedDocument.querySelectorAll(exportedMappingSelector).forEach((select, index) => {
        const selectedValue = Object.values(exportMappingSelects)[index].value;
        [...select.options].forEach(option => {
          if (option.value === selectedValue) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        });
      });

      const exportStyles = document.createElement('style');
      exportStyles.textContent = `
        body { height: auto; min-height: 100vh; overflow: auto; }
        .slide:not(:nth-of-type(${slideNumber})) { display: none !important; }
        main > .slide:nth-of-type(${slideNumber}) {
          position: relative; display: flex !important; min-height: 100vh;
          overflow: visible; padding-bottom: 38px;
        }
        #network-bg { position: fixed; }
        .progress-bar, .dots-nav, .nav-controls { display: none !important; }
      `;
      exportedDocument.querySelector('head').append(exportStyles);

      const exportedHtml = `<!DOCTYPE html>\n${exportedDocument.outerHTML.replace(
        /const match = \/\^#\(\[1-6\]\)\$\/\.exec\(location\.hash\);\s*setSlide\(match \? Number\(match\[1\]\) - 1 : 0\);/,
        `const match = /^#([1-6])$/.exec(location.hash); setSlide(match ? Number(match[1]) - 1 : ${slideNumber - 1});`
      )}`;
      const fileUrl = URL.createObjectURL(new Blob([exportedHtml], { type: 'text/html;charset=utf-8' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = isDinoSlide ? 'Урок 5 - слайд 5.html' : 'Урок 5 - слайд 3.html';
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
      if (standaloneWindow) {
        try {
          standaloneWindow.location.href = fileUrl;
          setStatus(exportStatus, `Слайд ${slideNumber} скачан и открыт отдельно. Разрешите камеру в новой вкладке.`, 'success');
        } catch (error) {
          setStatus(exportStatus, `Файл скачан, но браузер не открыл новую вкладку: ${error instanceof Error ? error.message : String(error)}. Откройте файл из загрузок.`, 'error');
        }
      } else {
        const reason = openError ? ` (${openError})` : '';
        const fileName = isDinoSlide ? 'Урок 5 - слайд 5.html' : 'Урок 5 - слайд 3.html';
        setStatus(exportStatus, `Слайд скачан${reason}. Откройте файл «${fileName}» из загрузок браузера.`, 'success');
      }
    }

    function setSlide(index) {
      if (index < 0 || index >= slides.length) return;
      if (currentSlide !== index) {
        if (inferenceRunning || cameraStartPending) stopCamera();
        if (dinoInferenceRunning || dinoCameraStartPending) stopDinoCamera();
        if (currentSlide === 4 && dinoGameState === 'running') pauseDinoGame();
      }
      currentSlide = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === currentSlide);
        slide.setAttribute('aria-hidden', String(slideIndex !== currentSlide));
        slide.querySelectorAll('video').forEach(video => {
          if (slideIndex === currentSlide) video.play().catch(() => {});
          else video.pause();
        });
      });
      [...dotsNav.children].forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === currentSlide);
        if (dotIndex === currentSlide) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      counter.textContent = `${currentSlide + 1} / ${slides.length}`;
      progress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
      prevButton.disabled = currentSlide === 0;
      nextButton.disabled = currentSlide === slides.length - 1;
      slides[currentSlide].scrollTop = 0;
      history.replaceState(null, '', `#${currentSlide + 1}`);
    }

    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot-nav';
      const title = slides[index].querySelector('h1, h2').textContent.trim();
      dot.title = `Слайд ${index + 1}: ${title}`;
      dot.setAttribute('aria-label', dot.title);
      dot.addEventListener('click', () => setSlide(index));
      dotsNav.append(dot);
    });

    document.getElementById('startBtn').addEventListener('click', () => setSlide(1));
    prevButton.addEventListener('click', () => setSlide(currentSlide - 1));
    nextButton.addEventListener('click', () => setSlide(currentSlide + 1));

    function goToHash() {
      const match = /^#([1-6])$/.exec(location.hash);
      setSlide(match ? Number(match[1]) - 1 : 0);
    }

    window.addEventListener('hashchange', goToHash);

    document.addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, select, button, a, summary, video, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return;
      const destinations = {
        ArrowRight: currentSlide + 1,
        PageDown: currentSlide + 1,
        ArrowLeft: currentSlide - 1,
        PageUp: currentSlide - 1,
        Home: 0,
        End: slides.length - 1
      };
      if (Object.hasOwn(destinations, event.key)) {
        event.preventDefault();
        setSlide(destinations[event.key]);
      }
    });

    const canvas = document.getElementById('network-bg');
    const ctx = canvas.getContext('2d');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let particles = [];
    let animationFrame = null;

    function initParticles() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      particles = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - .5) * .9,
        vy: (Math.random() - .5) * .9,
        radius: Math.random() * 1.5 + 1
      }));
      drawBackground(false);
    }

    function drawBackground(move) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle, index) => {
        if (move) {
          const motionScale = reducedMotion.matches ? .35 : 1;
          particle.x += particle.vx * motionScale;
          particle.y += particle.vy * motionScale;
          if (particle.x < -30) particle.x = canvas.width + 30;
          if (particle.x > canvas.width + 30) particle.x = -30;
          if (particle.y < -30) particle.y = canvas.height + 30;
          if (particle.y > canvas.height + 30) particle.y = -30;
        }
        particles.slice(index + 1).forEach(other => {
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < 190) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${.12 * (1 - distance / 190)})`;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
        ctx.fillStyle = 'rgba(244, 63, 94, .2)';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function animate() {
      animationFrame = null;
      if (document.hidden) return;
      drawBackground(true);
      animationFrame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (!document.hidden) animate();
      else drawBackground(false);
    }

    window.addEventListener('resize', initParticles);
    document.addEventListener('visibilitychange', updateAnimation);
    reducedMotion.addEventListener('change', updateAnimation);

    function updateThreshold() {
      const value = Number(threshold.value);
      thresholdValue.value = `${value}%`;
      thresholdValue.textContent = `${value}%`;
    }

    function updateVolume() {
      const value = Number(volumeControl.value);
      audioPlayer.volume = value / 100;
      volumeValue.value = `${value}%`;
      volumeValue.textContent = `${value}%`;
    }

    function setPrediction(label, score) {
      const percentage = Math.round(score * 100);
      predictionLabel.textContent = label;
      confidence.textContent = `${percentage}%`;
      confidenceMeter.style.width = `${percentage}%`;
      confidenceProgress.setAttribute('aria-valuenow', String(percentage));
    }

    function guessLabel(labels, words) {
      return labels.find(label => words.some(word => label.toLocaleLowerCase('ru').includes(word))) || '';
    }

    function fillMappingOptions(labels) {
      const defaults = {
        up: guessLabel(labels, ['громкость +', 'громкость плюс', 'увелич', 'volume up', 'volume plus']),
        down: guessLabel(labels, ['громкость −', 'громкость -', 'громкость минус', 'уменьш', 'volume down', 'volume minus']),
        play: guessLabel(labels, ['пуск', 'старт', 'воспроизвести', 'play', 'start']),
        pause: guessLabel(labels, ['пауза', 'pause', 'stop']),
        forward: guessLabel(labels, ['вперёд', 'вперед', 'след', 'перемотка впер', 'forward', 'next']),
        back: guessLabel(labels, ['назад', 'предыдущ', 'перемотка назад', 'back', 'previous']),
        neutral: guessLabel(labels, ['нейтр', 'ничего', 'nothing', 'neutral'])
      };
      Object.entries(mappingSelects).forEach(([key, select]) => {
        select.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Выберите класс';
        select.append(placeholder);
        labels.forEach(label => {
          const option = document.createElement('option');
          option.value = label;
          option.textContent = label;
          select.append(option);
        });
        select.disabled = false;
        select.value = defaults[key];
      });
      threshold.disabled = false;
    }

    function readModelBaseUrl(rawValue) {
      let url;
      try {
        url = new URL(rawValue.trim());
      } catch {
        throw new Error('Введите корректный URL опубликованной модели.');
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Адрес модели должен начинаться с http:// или https://.');
      }
      if (url.pathname.endsWith('model.json')) {
        url.pathname = url.pathname.slice(0, -'model.json'.length);
      }
      if (!url.pathname.endsWith('/')) url.pathname += '/';
      url.search = '';
      url.hash = '';
      return url.href;
    }

    function addCacheBuster(url, value) {
      const cacheBustedUrl = new URL(url);
      cacheBustedUrl.searchParams.set('_lesson_refresh', value);
      return cacheBustedUrl.href;
    }

    function guessDinoLabel(labels, words) {
      return labels.find(label => words.some(word => label.toLocaleLowerCase('ru').includes(word))) || '';
    }

    function fillDinoMappingOptions(labels) {
      const defaults = {
        start: guessDinoLabel(labels, ['старт', 'начать', 'пуск', 'start', 'play']),
        stop: guessDinoLabel(labels, ['стоп', 'пауза', 'останов', 'stop', 'pause']),
        jump: guessDinoLabel(labels, ['прыж', 'jump']),
        duck: guessDinoLabel(labels, ['нагнуться', 'нагиб', 'наклон', 'присесть', 'duck', 'crouch']),
        neutral: guessDinoLabel(labels, ['нейтр', 'ничего', 'neutral', 'nothing'])
      };
      Object.entries(dinoMappingSelects).forEach(([key, select]) => {
        select.replaceChildren(new Option('Выберите класс', ''));
        labels.forEach(label => select.append(new Option(label, label)));
        select.disabled = false;
        select.value = defaults[key];
      });
      dinoThreshold.disabled = false;
    }

    function updateDinoThreshold() {
      const value = Number(dinoThreshold.value);
      dinoThresholdValue.value = `${value}%`;
      dinoThresholdValue.textContent = `${value}%`;
    }

    function setDinoPrediction(label, score) {
      dinoPredictionLabel.textContent = label;
      dinoConfidence.textContent = `${Math.round(score * 100)}%`;
    }

    function drawDinoScene() {
      const { width, height } = dinoGameCanvas;
      const groundY = height - 34;
      const now = performance.now();
      const ducking = now < dinoDuckUntil;
      const jumping = now < dinoJumpUntil;
      const playerX = 76;
      const playerHeight = ducking ? 25 : 52;
      const playerY = groundY - playerHeight - (jumping ? 58 : 0);

      dinoGameContext.clearRect(0, 0, width, height);
      dinoGameContext.fillStyle = '#f8fafc';
      dinoGameContext.fillRect(0, 0, width, height);
      dinoGameContext.fillStyle = '#e2e8f0';
      dinoGameContext.beginPath();
      dinoGameContext.arc(width - 96, 48, 23, 0, Math.PI * 2);
      dinoGameContext.fill();
      dinoGameContext.strokeStyle = '#64748b';
      dinoGameContext.lineWidth = 3;
      dinoGameContext.beginPath();
      dinoGameContext.moveTo(0, groundY);
      dinoGameContext.lineTo(width, groundY);
      dinoGameContext.stroke();
      dinoGameContext.fillStyle = '#334155';
      dinoGameContext.fillRect(playerX + (ducking ? 5 : 8), playerY, ducking ? 43 : 35, playerHeight);
      dinoGameContext.fillRect(playerX + (ducking ? 30 : 26), playerY - (ducking ? 1 : 12), 18, ducking ? 16 : 20);
      dinoGameContext.fillStyle = '#f8fafc';
      dinoGameContext.fillRect(playerX + 37, playerY - (ducking ? -3 : 5), 4, 4);
      dinoGameContext.fillStyle = '#15803d';
      dinoGameContext.fillRect(dinoObstacleX, groundY - 38, 13, 38);
      dinoGameContext.fillRect(dinoObstacleX - 6, groundY - 25, 9, 6);
      dinoGameContext.fillRect(dinoObstacleX + 10, groundY - 32, 9, 6);
    }

    function finishDinoGame() {
      dinoGameState = 'over';
      dinoGameStatus.textContent = 'Столкновение! Покажите «старт» или нажмите кнопку, чтобы сыграть ещё.';
      dinoAnimationFrame = null;
      drawDinoScene();
    }

    function runDinoGameFrame(timestamp) {
      if (dinoGameState !== 'running') {
        dinoAnimationFrame = null;
        return;
      }
      const elapsed = Math.min((timestamp - dinoLastFrame) / 1000, .05);
      dinoLastFrame = timestamp;
      dinoObstacleX -= 300 * elapsed;
      if (dinoObstacleX < -24) {
        dinoObstacleX = dinoGameCanvas.width + 80 + Math.random() * 180;
        dinoScore += 10;
        dinoScoreOutput.value = String(dinoScore);
        dinoScoreOutput.textContent = String(dinoScore);
      }
      const playerRight = 76 + (timestamp < dinoDuckUntil ? 53 : 43);
      if (dinoObstacleX < playerRight && dinoObstacleX + 20 > 76
        && timestamp >= dinoJumpUntil && timestamp >= dinoDuckUntil) {
        finishDinoGame();
        return;
      }
      drawDinoScene();
      dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
    }

    function startDinoGame(restart = false) {
      if (dinoGameState === 'paused' && !restart) {
        dinoGameState = 'running';
        dinoGameStatus.textContent = 'Игра продолжается — перепрыгивайте или пригибайтесь перед препятствиями.';
        dinoLastFrame = performance.now();
        dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
        return;
      }
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
      dinoAnimationFrame = null;
      dinoScore = 0;
      dinoScoreOutput.value = '0';
      dinoScoreOutput.textContent = '0';
      dinoObstacleX = dinoGameCanvas.width - 70;
      dinoJumpUntil = 0;
      dinoDuckUntil = 0;
      dinoGameState = 'running';
      dinoGameStatus.textContent = 'Игра идёт — перепрыгивайте или пригибайтесь перед препятствиями.';
      dinoLastFrame = performance.now();
      drawDinoScene();
      dinoAnimationFrame = requestAnimationFrame(runDinoGameFrame);
    }

    function pauseDinoGame() {
      if (dinoGameState !== 'running') return;
      dinoGameState = 'paused';
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
      dinoAnimationFrame = null;
      dinoGameStatus.textContent = 'Игра на паузе. Покажите «старт», чтобы продолжить.';
      drawDinoScene();
    }

    function jumpDino() {
      if (dinoGameState !== 'running') {
        dinoGameStatus.textContent = 'Сначала запустите игру жестом «старт» или кнопкой.';
        return;
      }
      dinoJumpUntil = performance.now() + 680;
      dinoDuckUntil = 0;
      dinoGameStatus.textContent = 'Прыжок!';
    }

    function duckDino() {
      if (dinoGameState !== 'running') {
        dinoGameStatus.textContent = 'Сначала запустите игру жестом «старт» или кнопкой.';
        return;
      }
      dinoDuckUntil = performance.now() + 720;
      dinoJumpUntil = 0;
      dinoGameStatus.textContent = 'Динозаврик пригнулся.';
    }

    function runDinoAction(action) {
      if (action === 'start') {
        startDinoGame();
        dinoActionLabel.textContent = 'Игра запущена или перезапущена';
      } else if (action === 'stop') {
        pauseDinoGame();
        dinoActionLabel.textContent = 'Игра приостановлена';
      } else if (action === 'jump') {
        jumpDino();
        dinoActionLabel.textContent = 'Команда: прыжок';
      } else if (action === 'duck') {
        duckDino();
        dinoActionLabel.textContent = 'Команда: нагнуться';
      }
    }

    async function loadDinoModel(event) {
      event.preventDefault();
      if (!window.tmImage || !window.tf) {
        setStatus(dinoModelStatus, 'Не удалось загрузить библиотеки модели. Проверьте подключение к интернету и обновите страницу.', 'error');
        return;
      }
      if (dinoInferenceRunning || dinoCameraStartPending) stopDinoCamera();
      dinoModel = null;
      let loadedTensorflowModel = null;
      dinoLoadModelButton.disabled = true;
      dinoCameraButton.disabled = true;
      Object.values(dinoMappingSelects).forEach(select => {
        select.disabled = true;
        select.replaceChildren(new Option('Загрузка модели…', ''));
      });
      dinoThreshold.disabled = true;
      setStatus(dinoModelStatus, 'Загружаю модель…', 'working');
      try {
        const baseUrl = readModelBaseUrl(document.getElementById('dino-model-url').value);
        const refreshKey = `${Date.now()}-${crypto.randomUUID()}`;
        const [tensorflowModel, metadataResponse] = await Promise.all([
          window.tf.loadLayersModel(addCacheBuster(`${baseUrl}model.json`, refreshKey), { requestInit: { cache: 'no-store' } }),
          fetch(addCacheBuster(`${baseUrl}metadata.json`, refreshKey), { cache: 'no-store' })
        ]);
        loadedTensorflowModel = tensorflowModel;
        if (!metadataResponse.ok) throw new Error(`Не удалось загрузить metadata.json (HTTP ${metadataResponse.status}).`);
        const metadata = await metadataResponse.json();
        const labels = metadata.labels;
        if (!Array.isArray(labels) || !labels.every(label => typeof label === 'string')) {
          throw new Error('В metadata.json отсутствует список названий классов.');
        }
        if (!labels.length) throw new Error('В опубликованной модели не найдены классы.');
        const outputCount = tensorflowModel.outputs[0]?.shape[1];
        if (outputCount !== labels.length) {
          throw new Error(`Модель выдаёт ${outputCount ?? 'неизвестное число'} классов, а metadata.json содержит ${labels.length}. Опубликуйте модель заново в Teachable Machine и подключите новую ссылку.`);
        }
        dinoModel = new window.tmImage.CustomMobileNet(tensorflowModel, metadata);
        loadedTensorflowModel = null;
        fillDinoMappingOptions(labels);
        lastDinoActionClass = null;
        dinoCameraButton.disabled = false;
        setStatus(dinoModelStatus, `Модель подключена · классов: ${labels.length}. Назначьте команды и запустите камеру.`, 'success');
      } catch (error) {
        if (loadedTensorflowModel) loadedTensorflowModel.dispose();
        dinoModel = null;
        Object.values(dinoMappingSelects).forEach(select => {
          select.disabled = true;
          select.replaceChildren(new Option('Не удалось загрузить модель', ''));
        });
        dinoThreshold.disabled = true;
        setStatus(dinoModelStatus, `Не удалось загрузить модель: ${error instanceof Error ? error.message : String(error)}`, 'error');
      } finally {
        dinoLoadModelButton.disabled = false;
      }
    }

    async function startDinoCamera() {
      if (!dinoModel) {
        setStatus(document.getElementById('dino-camera-status'), 'Сначала подключите модель.', 'error');
        return;
      }
      if (!isCameraAllowedByFramePolicy()) {
        setStatus(document.getElementById('dino-camera-status'), 'Встроенная страница блокирует камеру. Скачайте слайд 5, откройте его отдельно и разрешите камеру.', 'error');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(document.getElementById('dino-camera-status'), 'Для камеры нужен HTTPS или localhost. Если урок встроен в сайт, скачайте слайд 5 и откройте его отдельно.', 'error');
        return;
      }
      dinoCameraButton.disabled = true;
      dinoCameraStartPending = true;
      const requestId = ++dinoCameraRequestId;
      setStatus(document.getElementById('dino-camera-status'), 'Разрешите доступ к камере в запросе браузера…', 'working');
      try {
        dinoCameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (requestId !== dinoCameraRequestId) {
          dinoCameraStream.getTracks().forEach(track => track.stop());
          dinoCameraStream = null;
          return;
        }
        dinoCameraVideo = document.createElement('video');
        dinoCameraVideo.autoplay = true;
        dinoCameraVideo.muted = true;
        dinoCameraVideo.playsInline = true;
        dinoCameraVideo.setAttribute('aria-label', 'Изображение с камеры для распознавания поз');
        dinoCameraVideo.srcObject = dinoCameraStream;
        dinoWebcamContainer.replaceChildren(dinoCameraVideo);
        await dinoCameraVideo.play();
        await new Promise((resolve, reject) => {
          if (dinoCameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }
          dinoCameraVideo.addEventListener('loadeddata', resolve, { once: true });
          dinoCameraVideo.addEventListener('error', () => reject(new Error('Не удалось получить изображение с камеры.')), { once: true });
        });
        if (requestId !== dinoCameraRequestId) {
          stopDinoCamera();
          return;
        }
        dinoInferenceRunning = true;
        dinoStopCameraButton.disabled = false;
        setStatus(document.getElementById('dino-camera-status'), 'Камера работает. Покажите позу и дождитесь распознавания.', 'success');
        runDinoPrediction();
      } catch (error) {
        stopDinoCamera();
        const name = error instanceof DOMException ? error.name : '';
        const message = name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Браузер не выдал доступ к камере. Разрешите камеру или откройте скачанный слайд отдельно.'
          : name === 'NotFoundError'
            ? 'Камера не найдена. Подключите камеру и проверьте, что она доступна системе.'
            : name === 'NotReadableError'
              ? 'Камера занята другим приложением. Закройте его и попробуйте снова.'
              : `Не удалось запустить камеру: ${error instanceof Error ? error.message : String(error)}`;
        setStatus(document.getElementById('dino-camera-status'), message, 'error');
      } finally {
        if (requestId === dinoCameraRequestId) {
          dinoCameraStartPending = false;
          dinoCameraButton.disabled = !dinoModel || dinoInferenceRunning;
        }
      }
    }

    async function applyDinoPrediction() {
      if (!dinoModel || !dinoCameraVideo || !dinoInferenceRunning) return;
      const predictions = await dinoModel.predict(dinoCameraVideo);
      const best = predictions.reduce((top, item) => item.probability > top.probability ? item : top);
      setDinoPrediction(best.className, best.probability);
      if (best.probability < Number(dinoThreshold.value) / 100) {
        dinoActionLabel.textContent = 'Уверенность ниже порога — команды нет';
        lastDinoActionClass = null;
        return;
      }
      if (best.className === dinoMappingSelects.neutral.value) {
        dinoActionLabel.textContent = 'Нейтральная поза — команды нет';
        lastDinoActionClass = null;
        return;
      }
      const actions = Object.entries(dinoMappingSelects)
        .filter(([key, select]) => key !== 'neutral' && select.value === best.className)
        .map(([key]) => key);
      if (actions.length > 1) {
        dinoActionLabel.textContent = 'Класс назначен нескольким командам — выберите разные классы';
        lastDinoActionClass = null;
        return;
      }
      if (!actions.length) {
        dinoActionLabel.textContent = 'Жест распознан; назначьте этому классу команду';
        lastDinoActionClass = null;
        return;
      }
      if (lastDinoActionClass === best.className) {
        dinoActionLabel.textContent = 'Команда уже выполнена; покажите нейтральную позу для повтора';
        return;
      }
      runDinoAction(actions[0]);
      lastDinoActionClass = best.className;
    }

    async function runDinoPrediction() {
      if (!dinoInferenceRunning) return;
      try {
        await applyDinoPrediction();
      } catch (error) {
        stopDinoCamera();
        setStatus(document.getElementById('dino-camera-status'), `Ошибка распознавания: ${error instanceof Error ? error.message : String(error)}`, 'error');
        return;
      }
      if (dinoInferenceRunning) window.setTimeout(runDinoPrediction, 180);
    }

    function stopDinoCamera() {
      dinoCameraRequestId += 1;
      dinoCameraStartPending = false;
      dinoInferenceRunning = false;
      if (dinoCameraVideo) {
        dinoCameraVideo.pause();
        dinoCameraVideo.srcObject = null;
        dinoCameraVideo = null;
      }
      if (dinoCameraStream) {
        dinoCameraStream.getTracks().forEach(track => track.stop());
        dinoCameraStream = null;
      }
      dinoWebcamContainer.replaceChildren(document.createTextNode('Камера остановлена'));
      dinoCameraButton.disabled = !dinoModel;
      dinoStopCameraButton.disabled = true;
      lastDinoActionClass = null;
    }

    async function loadModel(event) {
      event.preventDefault();
      if (!window.tmImage || !window.tf) {
        setStatus(modelStatus, 'Не удалось загрузить библиотеки модели. Проверьте подключение к интернету и обновите страницу.', 'error');
        return;
      }
      if (inferenceRunning || cameraStartPending) stopCamera();
      model = null;
      let loadedTensorflowModel = null;
      loadModelButton.disabled = true;
      cameraButton.disabled = true;
      Object.values(mappingSelects).forEach(select => {
        select.disabled = true;
        select.replaceChildren(new Option('Загрузка модели…', ''));
      });
      threshold.disabled = true;
      setStatus(modelStatus, 'Загружаю модель…', 'working');
      try {
        const baseUrl = readModelBaseUrl(document.getElementById('model-url').value);
        const refreshKey = `${Date.now()}-${crypto.randomUUID()}`;
        const modelUrl = addCacheBuster(`${baseUrl}model.json`, refreshKey);
        const metadataUrl = addCacheBuster(`${baseUrl}metadata.json`, refreshKey);
        const [tensorflowModel, metadataResponse] = await Promise.all([
          window.tf.loadLayersModel(modelUrl, { requestInit: { cache: 'no-store' } }),
          fetch(metadataUrl, { cache: 'no-store' })
        ]);
        loadedTensorflowModel = tensorflowModel;
        if (!metadataResponse.ok) {
          throw new Error(`Не удалось загрузить metadata.json (HTTP ${metadataResponse.status}).`);
        }
        const metadata = await metadataResponse.json();
        const labels = metadata.labels;
        if (!Array.isArray(labels) || !labels.every(label => typeof label === 'string')) {
          throw new Error('В metadata.json отсутствует список названий классов.');
        }
        if (!labels.length) throw new Error('В опубликованной модели не найдены классы.');
        const outputCount = tensorflowModel.outputs[0]?.shape[1];
        if (outputCount !== labels.length) {
          throw new Error(`Модель выдаёт ${outputCount ?? 'неизвестное число'} классов, а metadata.json содержит ${labels.length}. Опубликуйте модель заново в Teachable Machine и подключите новую ссылку.`);
        }
        const loadedModel = new window.tmImage.CustomMobileNet(tensorflowModel, metadata);
        model = loadedModel;
        loadedTensorflowModel = null;
        fillMappingOptions(labels);
        lastActionClass = null;
        cameraButton.disabled = false;
        setStatus(
          modelStatus,
          `Модель подключена · классов: ${labels.length}. Камера доступна; назначьте команды для нужных классов.`,
          'success'
        );
      } catch (error) {
        if (loadedTensorflowModel) loadedTensorflowModel.dispose();
        model = null;
        Object.values(mappingSelects).forEach(select => {
          select.disabled = true;
          select.replaceChildren(new Option('Не удалось загрузить модель', ''));
        });
        threshold.disabled = true;
        setStatus(modelStatus, `Не удалось загрузить модель: ${error instanceof Error ? error.message : String(error)}`, 'error');
      } finally {
        loadModelButton.disabled = false;
      }
    }

    async function startCamera() {
      if (!model) {
        setStatus(cameraStatus, 'Сначала подключите модель.', 'error');
        return;
      }
      if (!isCameraAllowedByFramePolicy()) {
        setStatus(cameraStatus, 'Google Sites блокирует камеру во встроенном окне. Нажмите «Открыть урок отдельно» ниже и разрешите камеру на открывшейся странице.', 'error');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(cameraStatus, 'Для камеры нужен HTTPS или localhost. Если урок открыт в Google Sites, нажмите «Открыть урок отдельно».', 'error');
        return;
      }
      cameraButton.disabled = true;
      cameraStartPending = true;
      const requestId = ++cameraRequestId;
      setStatus(cameraStatus, 'Разрешите доступ к камере в запросе браузера…', 'working');
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (requestId !== cameraRequestId) {
          cameraStream.getTracks().forEach(track => track.stop());
          cameraStream = null;
          return;
        }
        cameraVideo = document.createElement('video');
        cameraVideo.autoplay = true;
        cameraVideo.muted = true;
        cameraVideo.playsInline = true;
        cameraVideo.setAttribute('aria-label', 'Изображение с камеры для распознавания жестов');
        cameraVideo.srcObject = cameraStream;
        webcamContainer.replaceChildren(cameraVideo);
        await cameraVideo.play();
        await new Promise((resolve, reject) => {
          if (cameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }
          cameraVideo.addEventListener('loadeddata', resolve, { once: true });
          cameraVideo.addEventListener('error', () => reject(new Error('Не удалось получить изображение с камеры.')), { once: true });
        });
        if (requestId !== cameraRequestId) {
          stopCamera();
          return;
        }
        inferenceRunning = true;
        stopButton.disabled = false;
        setStatus(cameraStatus, 'Камера работает. Покажите жест и дождитесь распознавания.', 'success');
        runPrediction();
      } catch (error) {
        stopCamera();
        const name = error instanceof DOMException ? error.name : '';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const permissionDenied = name === 'NotAllowedError'
          || name === 'SecurityError'
          || /denied|permission|could not open your camera/i.test(errorMessage);
        const message = permissionDenied
          ? 'Браузер не выдал доступ к камере. Если урок встроен в Google Sites, нажмите «Открыть урок отдельно», разрешите камеру и попробуйте снова.'
          : name === 'NotFoundError'
            ? 'Камера не найдена. Подключите камеру и проверьте, что она доступна системе.'
            : name === 'NotReadableError'
              ? 'Камера занята другим приложением. Закройте его и попробуйте снова.'
              : `Не удалось запустить камеру. Проверьте разрешение браузера и доступность камеры. ${errorMessage}`;
        setStatus(cameraStatus, message, 'error');
      } finally {
        if (requestId === cameraRequestId) {
          cameraStartPending = false;
          cameraButton.disabled = !model || inferenceRunning;
        }
      }
    }

    function mappedAction(className) {
      const actions = Object.entries(mappingSelects)
        .filter(([key, select]) => key !== 'neutral' && select.value === className)
        .map(([key]) => key);
      return actions.length === 1 ? actions[0] : actions.length > 1 ? 'ambiguous' : '';
    }

    async function applyPrediction() {
      if (!model || !cameraVideo || !inferenceRunning) return;
      const predictions = await model.predict(cameraVideo);
      const best = predictions.reduce((top, item) => item.probability > top.probability ? item : top);
      const score = best.probability;
      setPrediction(best.className, score);

      if (score < Number(threshold.value) / 100) {
        actionLabel.textContent = 'Уверенность ниже порога — команды нет';
        lastActionClass = null;
        return;
      }
      if (best.className === mappingSelects.neutral.value) {
        actionLabel.textContent = 'Нейтральный класс — команды нет';
        lastActionClass = null;
        return;
      }
      const action = mappedAction(best.className);
      if (action === 'ambiguous') {
        actionLabel.textContent = 'Этот класс назначен нескольким командам; выберите для каждой команды свой класс';
        lastActionClass = null;
        return;
      }
      if (!action) {
        actionLabel.textContent = 'Жест распознан; назначьте этому классу команду';
        lastActionClass = null;
        return;
      }
      if (lastActionClass === best.className) {
        actionLabel.textContent = 'Команда уже выполнена; покажите нейтральный жест для повтора';
        return;
      }

      if (action === 'up') {
        volumeControl.value = String(Math.min(100, Number(volumeControl.value) + 10));
        updateVolume();
        actionLabel.textContent = 'Громкость аудиофайла увеличена на 10%';
      } else if (action === 'down') {
        volumeControl.value = String(Math.max(0, Number(volumeControl.value) - 10));
        updateVolume();
        actionLabel.textContent = 'Громкость аудиофайла уменьшена на 10%';
      } else if (action === 'forward' || action === 'back') {
        if (!audioPlayer.src || audioPlayer.error) {
          actionLabel.textContent = 'Выберите аудиофайл для перемотки';
        } else if (!Number.isFinite(audioPlayer.duration)) {
          actionLabel.textContent = 'Дождитесь загрузки аудиофайла';
        } else {
          const direction = action === 'forward' ? 1 : -1;
          const targetTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + direction * 10));
          audioPlayer.currentTime = targetTime;
          actionLabel.textContent = action === 'forward' ? 'Перемотка вперёд на 10 секунд' : 'Перемотка назад на 10 секунд';
        }
      } else if (action === 'play') {
        if (!audioPlayer.src || audioPlayer.error) {
          actionLabel.textContent = 'Не удалось загрузить музыку. Выберите аудиофайл.';
        } else if (audioPlayer.paused) {
          try {
            await audioPlayer.play();
            actionLabel.textContent = 'Аудио воспроизводится';
          } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              actionLabel.textContent = 'Сначала нажмите ▶ на аудиоплеере, чтобы разрешить воспроизведение';
            } else {
              throw error;
            }
          }
        } else {
          actionLabel.textContent = 'Музыка уже воспроизводится';
        }
      } else if (action === 'pause') {
        if (audioPlayer.error) {
          actionLabel.textContent = 'Не удалось загрузить музыку. Выберите аудиофайл.';
          lastActionClass = best.className;
          return;
        }
        if (!audioPlayer.paused) {
          audioPlayer.pause();
          actionLabel.textContent = 'Музыка приостановлена';
        } else {
          actionLabel.textContent = 'Музыка уже на паузе';
        }
      }
      lastActionClass = best.className;
    }

    async function runPrediction() {
      if (!inferenceRunning) return;
      try {
        await applyPrediction();
      } catch (error) {
        stopCamera();
        setStatus(cameraStatus, `Ошибка распознавания: ${error instanceof Error ? error.message : String(error)}`, 'error');
        return;
      }
      if (inferenceRunning) window.setTimeout(runPrediction, 180);
    }

    function stopCamera() {
      cameraRequestId += 1;
      cameraStartPending = false;
      inferenceRunning = false;
      if (cameraVideo) {
        cameraVideo.pause();
        cameraVideo.srcObject = null;
        cameraVideo = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      webcamContainer.replaceChildren(document.createTextNode('Камера остановлена'));
      cameraButton.disabled = !model;
      stopButton.disabled = true;
      lastActionClass = null;
    }

    modelForm.addEventListener('submit', loadModel);
    downloadSlideButton.addEventListener('click', () => downloadAndOpenSlide(3));
    dinoModelForm.addEventListener('submit', loadDinoModel);
    downloadDinoSlideButton.addEventListener('click', () => downloadAndOpenSlide(5));
    cameraButton.addEventListener('click', startCamera);
    dinoCameraButton.addEventListener('click', startDinoCamera);
    document.getElementById('dino-stop-camera').addEventListener('click', () => {
      stopDinoCamera();
      setStatus(document.getElementById('dino-camera-status'), 'Камера остановлена.', '');
    });
    document.getElementById('dino-start').addEventListener('click', () => startDinoGame(true));
    document.getElementById('dino-stop').addEventListener('click', pauseDinoGame);
    document.getElementById('dino-jump').addEventListener('click', jumpDino);
    document.getElementById('dino-duck').addEventListener('click', duckDino);
    stopButton.addEventListener('click', () => {
      stopCamera();
      setStatus(cameraStatus, 'Камера остановлена.', '');
    });
    threshold.addEventListener('input', updateThreshold);
    dinoThreshold.addEventListener('input', updateDinoThreshold);
    volumeControl.addEventListener('input', updateVolume);

    audioFile.addEventListener('change', () => {
      const file = audioFile.files && audioFile.files[0];
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
      audioPlayer.pause();
      if (!file) {
        audioPlayer.src = defaultAudioUrl;
        audioPlayer.load();
        return;
      }
      currentAudioUrl = URL.createObjectURL(file);
      audioPlayer.src = currentAudioUrl;
      audioPlayer.load();
      setStatus(audioStatus, `Выбран файл: ${file.name}.`, 'success');
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      setStatus(audioStatus, 'Музыка готова. Нажмите ▶ в плеере, затем проверяйте жесты.', 'success');
    });
    audioPlayer.addEventListener('error', () => {
      setStatus(audioStatus, 'Источник музыки недоступен. Выберите аудиофайл с компьютера.', 'error');
    });

    window.addEventListener('pagehide', () => {
      stopCamera();
      stopDinoCamera();
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      if (dinoAnimationFrame !== null) cancelAnimationFrame(dinoAnimationFrame);
    });

    updateThreshold();
    updateDinoThreshold();
    updateVolume();
    drawDinoScene();
    initParticles();
    updateAnimation();
    goToHash();
  };

  /* Lesson 11-6 (11 класс - 6 урок) */
  LESSON_SCRIPTS['11-6'] = function() {
const slides = [...document.querySelectorAll('.slide')];
      const dotsNav = document.getElementById('dotsNav');
      const counter = document.getElementById('counter');
      const progress = document.getElementById('progress');
      const prevButton = document.getElementById('prevBtn');
      const nextButton = document.getElementById('nextBtn');
      let currentSlide = 0;

      function goToSlide(number) {
        if (number < 0 || number >= slides.length) return;
        currentSlide = number;
        slides.forEach((slide, index) => {
          const active = index === currentSlide;
          slide.classList.toggle('active', active);
          slide.setAttribute('aria-hidden', String(!active));
        });
        [...dotsNav.children].forEach((dot, index) => {
          const active = index === currentSlide;
          dot.classList.toggle('active', active);
          if (active) dot.setAttribute('aria-current', 'step');
          else dot.removeAttribute('aria-current');
        });
        progress.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
        counter.textContent = `${currentSlide + 1} / ${slides.length}`;
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === slides.length - 1;
        slides[currentSlide].scrollTop = 0;
        history.replaceState(null, '', `#${currentSlide + 1}`);
      }

      function goToHash() {
        const match = /^#([1-6])$/.exec(location.hash);
        goToSlide(match ? Number(match[1]) - 1 : 0);
      }

      const dotLabels = [
        '01 · Старт',
        '02 · Анатомия',
        '03 · Архитектура',
        '04 · Тренажёр',
        '05 · Практикум',
        '06 · Оценивание'
      ];

      slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot-nav';
        dot.title = dotLabels[index] || `Слайд ${index + 1}`;
        dot.setAttribute('aria-label', dot.title);
        dot.addEventListener('click', () => goToSlide(index));
        dotsNav.append(dot);
      });

      prevButton.addEventListener('click', () => goToSlide(currentSlide - 1));
      nextButton.addEventListener('click', () => goToSlide(currentSlide + 1));
      document.getElementById('startBtn').addEventListener('click', () => goToSlide(1));
      window.addEventListener('hashchange', goToHash);

      document.addEventListener('keydown', event => {
        if (event.target.closest('input, textarea, select, button, a, summary, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return;
        const destinations = {
          ArrowRight: currentSlide + 1,
          PageDown: currentSlide + 1,
          ArrowLeft: currentSlide - 1,
          PageUp: currentSlide - 1,
          Home: 0,
          End: slides.length - 1
        };
        if (Object.hasOwn(destinations, event.key)) {
          event.preventDefault();
          goToSlide(destinations[event.key]);
        }
      });

      /* Интерактивный тренажёр взвешивания признаков */
      const sPalm = document.getElementById('w-palm');
      const sFingers = document.getElementById('w-fingers');
      const sFist = document.getElementById('w-fist');

      const txtPalm = document.getElementById('txt-w-palm');
      const txtFingers = document.getElementById('txt-w-fingers');
      const txtFist = document.getElementById('txt-w-fist');

      const confPct = document.getElementById('confidence-pct');
      const confBar = document.getElementById('confidence-bar');
      const decText = document.getElementById('decision-text');

      function updateDecision() {
        if (!sPalm) return;
        const w1 = parseFloat(sPalm.value);
        const w2 = parseFloat(sFingers.value);
        const w3 = parseFloat(sFist.value);

        txtPalm.textContent = w1.toFixed(1);
        txtFingers.textContent = w2.toFixed(1);
        txtFist.textContent = w3.toFixed(1);

        let score = (1.0 * w1) + (1.0 * w2) + (0.0 * w3);
        let pct = Math.max(0, Math.min(100, Math.round((score / 2.0) * 100)));

        confPct.textContent = `${pct}%`;
        confBar.style.width = `${pct}%`;

        if (pct >= 60) {
          decText.textContent = 'Жест «СТОП ✋» РАСПОЗНАН!';
          decText.style.color = 'var(--success)';
        } else {
          decText.textContent = 'Недостаточно уверенности (жест не распознан)';
          decText.style.color = '#b42342';
        }
      }

      if (sPalm) {
        [sPalm, sFingers, sFist].forEach(s => s.addEventListener('input', updateDecision));
        updateDecision();
      }

      /* Экспресс-квиз */
      window.checkQuiz = function(btn, isCorrect) {
        const parent = btn.parentElement;
        [...parent.children].forEach(b => {
          b.classList.remove('correct', 'wrong');
          b.disabled = true;
        });
        if (isCorrect) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
        }
      };

      /* Генерация 3 случайных задач для перцептрона (Слайд 5) */
      let currentTasks = [];

      window.generateRandomTasks = function() {
        currentTasks = [];
        const weightsPool = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        const thresholdsPool = [0.8, 0.9, 1.0, 1.1, 1.2];

        for (let i = 1; i <= 3; i++) {
          const x1 = Math.random() > 0.4 ? 1 : 0;
          const x2 = Math.random() > 0.4 ? 1 : 0;
          const x3 = Math.random() > 0.4 ? 1 : 0;

          const w1 = weightsPool[Math.floor(Math.random() * weightsPool.length)];
          const w2 = weightsPool[Math.floor(Math.random() * weightsPool.length)];
          const w3 = weightsPool[Math.floor(Math.random() * weightsPool.length)];

          const T = thresholdsPool[Math.floor(Math.random() * thresholdsPool.length)];

          const S = (x1 * w1) + (x2 * w2) + (x3 * w3);
          const correctY = S >= T ? 1 : 0;

          currentTasks.push({ x1, x2, x3, w1, w2, w3, T, S, correctY });

          const mathBox = document.getElementById(`task-math-${i}`);
          if (mathBox) {
            mathBox.innerHTML = `
              <b>Входы:</b> x₁=${x1}, x₂=${x2}, x₃=${x3}<br>
              <b>Веса:</b> w₁=${w1}, w₂=${w2}, w₃=${w3}<br>
              <b>Порог:</b> T = ${T}
            `;
          }

          const fb = document.getElementById(`fb-y-${i}`);
          if (fb) {
            fb.textContent = '';
            fb.className = 'task-feedback';
          }
          const inp = document.getElementById(`ans-y-${i}`);
          if (inp) inp.value = '';
        }
      };

      window.checkTaskY = function(num) {
        const inp = document.getElementById(`ans-y-${num}`);
        const fb = document.getElementById(`fb-y-${num}`);
        if (!inp || !fb || !currentTasks[num - 1]) return;

        const val = inp.value.trim();
        if (val === '') {
          fb.textContent = 'Введите 0 или 1';
          fb.className = 'task-feedback wrong';
          return;
        }

        const userY = parseInt(val, 10);
        const task = currentTasks[num - 1];

        if (userY === task.correctY) {
          fb.textContent = '✓ Верно! (+2 б.)';
          fb.className = 'task-feedback correct';
        } else {
          fb.textContent = '✗ Неверно, пересчитайте';
          fb.className = 'task-feedback wrong';
        }
      };

      /* Скачивание шаблона таблицы для Excel (.csv с UTF-8 BOM) */
      window.downloadExcelTemplate = function() {
        const csvContent =
          '\uFEFF' +
          '№;Критерий;Как выбрать x;Вход x;Вес w;Вклад x*w / результат\n' +
          '3;Рейтинг фильма;Высокий — 1 / Низкий — 0;;;\n' +
          '4;Цена билета;Низкая — 1 / Высокая — 0;;;\n' +
          '5;Время сеанса;Удобное — 1 / Неудобное — 0;;;\n' +
          '6;Компания;Есть — 1 / Нет — 0;;;\n' +
          '7;Сумматор — sum (порог = 1);;;;\n' +
          '8;Активатор;;;;\n' +
          '9;Итоговое решение (Идём / Не идём);;;;\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Шаблон_Перцептрон_Excel.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      /* Защита от выделения, копирования и контекстного меню столбца с формулами */
      document.querySelectorAll('.sheet-table .cell-calc').forEach(cell => {
        cell.addEventListener('copy', e => e.preventDefault());
        cell.addEventListener('cut', e => e.preventDefault());
        cell.addEventListener('contextmenu', e => e.preventDefault());
      });

      /* Анимированный Canvas фон */
      const canvas = document.getElementById('network-bg');
      const ctx = canvas.getContext('2d');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      let particles = [];
      let animationFrame = null;

      function initParticles() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        particles = Array.from({ length: 35 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - .5) * .9,
          vy: (Math.random() - .5) * .9,
          radius: Math.random() * 1.5 + 1
        }));
        drawBackground(false);
      }

      function drawBackground(move) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle, index) => {
          if (move) {
            const motionScale = reducedMotion.matches ? .35 : 1;
            particle.x += particle.vx * motionScale;
            particle.y += particle.vy * motionScale;
            if (particle.x < -30) particle.x = canvas.width + 30;
            if (particle.x > canvas.width + 30) particle.x = -30;
            if (particle.y < -30) particle.y = canvas.height + 30;
            if (particle.y > canvas.height + 30) particle.y = -30;
          }
          particles.slice(index + 1).forEach(other => {
            const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
            if (distance < 190) {
              ctx.strokeStyle = `rgba(244, 63, 94, ${.12 * (1 - distance / 190)})`;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          });
          ctx.fillStyle = 'rgba(244, 63, 94, .2)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      function animate() {
        animationFrame = null;
        if (document.hidden) return;
        drawBackground(true);
        animationFrame = requestAnimationFrame(animate);
      }

      function updateAnimation() {
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        animationFrame = null;
        if (!document.hidden) animate();
        else drawBackground(false);
      }

      window.addEventListener('resize', initParticles);
      document.addEventListener('visibilitychange', updateAnimation);
      reducedMotion.addEventListener('change', updateAnimation);
      initParticles();
      updateAnimation();
      generateRandomTasks();
      goToHash();
  };

  /* 6. INITIALIZATION RUNNER */
  function runCurrentLesson() {
    initClassesModal();
    initMobileControls();

    // Identify current lesson from body class: lesson-{id}
    const bodyClass = document.body.className || '';
    const match = bodyClass.match(/lesson-([\w-]+)/);
    let runner = null;

    if (match && LESSON_SCRIPTS[match[1]]) {
      runner = LESSON_SCRIPTS[match[1]];
    } else {
      // Fallback: match from URL
      const path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
      for (const [key, fn] of Object.entries(LESSON_SCRIPTS)) {
        if (path.includes(key)) {
          runner = fn;
          break;
        }
      }
    }

    if (runner) {
      try {
        runner();
      } catch (err) {
        console.error('Error executing lesson script:', err);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCurrentLesson);
  } else {
    runCurrentLesson();
  }
})();
