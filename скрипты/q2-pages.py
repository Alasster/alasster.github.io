"""Генератор HTML-каркасов уроков 2 четверти.

Каждая страница — тонкая оболочка: навигация, контейнер #q2-root и подключение
общего движка. Содержимое урока живёт в соответствующем q2-data-*.js.
Запуск:  python скрипты/q2-pages.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SHELL = """\ufeff<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#e7ebf3">
  <title>{title}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 25c-12-8-25-9-39-5v52c14-4 27-3 39 6m0-53c12-8 25-9 39-5v52c-14-4-27-3-39 6m0-53v53' fill='none' stroke='%237C3AED' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/></svg>" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../стили/lessons.css?v=neu-2026-11-01-v64">
  <link rel="stylesheet" href="../../стили/q2.css?v=q2-2026-11-01-17">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="lesson-page q2-lesson lesson-{lesson_id}" data-lesson-id="{lesson_id}">

  <div class="nav-wrapper">
    <div class="container">
      <nav class="navbar">
        <a href="../../index.html" class="brand-logo-group" title="На главную">
          <div class="brand-icon-box">
            <i class="fa-solid fa-book-open"></i>
          </div>
          <span class="brand-title-text">ALASSTER.SITE</span>
        </a>

        <div class="nav-lesson-badge">
          <span class="nav-badge-class">{cls}</span>
          <span class="nav-badge-divider">·</span>
          <span class="nav-badge-num">Урок {num}</span>
          <span class="nav-badge-divider">·</span>
          <span class="nav-badge-topic">{title}</span>
        </div>

        <div class="nav-right-actions">
          <button class="classes-menu-btn" id="open-classes-menu-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Меню классов">
            <i class="fa-solid fa-layer-group"></i>
            <span class="menu-btn-text">Классы</span>
          </button>
        </div>
      </nav>
    </div>
  </div>

  <div class="modal-backdrop" id="modal-backdrop-el">
    <div class="modal-glass-container" role="dialog" aria-modal="true" aria-labelledby="modal-heading-el">
      <div class="modal-header-bar">
        <div class="modal-title-group">
          <p class="modal-eyebrow">Учебные материалы</p>
          <h3 class="modal-heading-text" id="modal-heading-el">Выберите класс и урок</h3>
        </div>
        <button class="btn-close-modal" id="btn-close-modal-el" type="button" aria-label="Закрыть">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-classes-nav">
        <button type="button" class="class-tab-pill" data-class-id="c9">9 класс</button>
        <button type="button" class="class-tab-pill" data-class-id="c10emn">10 ЕМН</button>
        <button type="button" class="class-tab-pill" data-class-id="c10ogn">10 ОГН</button>
        <button type="button" class="class-tab-pill" data-class-id="c11">11 класс</button>
        <a href="../../index.html" class="class-tab-pill tab-home-link"><i class="fa-solid fa-house"></i> Главная</a>
      </div>
      <div class="modal-lessons-scroll" id="modal-lessons-list"></div>
    </div>
  </div>

  <canvas id="network-bg" aria-hidden="true"></canvas>
  <div class="progress-bar" id="progress"></div>
  <div class="dots" id="dots" aria-hidden="false" aria-label="Слайды урока"></div>

  <main id="q2-root">
    <section class="slide active">
      <div class="container">
        <span class="eyebrow">{cls} · 2 четверть · Урок {num}</span>
        <h1>{title}</h1>
        <p class="lead">Загрузка материалов урока…</p>
      </div>
    </section>
  </main>

  <div class="nav-controls">
    <button class="nav-btn" id="prevBtn" onclick="changeSlide(-1)" aria-label="Предыдущий слайд"><i class="fas fa-arrow-left"></i></button>
    <button class="nav-btn" id="nextBtn" onclick="changeSlide(1)" aria-label="Следующий слайд"><i class="fas fa-arrow-right"></i></button>
  </div>

  <script src="../../скрипты/q2-scenes.js?v=q2-2026-11-01-15"></script>
  <script src="../../скрипты/q2-engine.js?v=q2-2026-11-01-15"></script>
  <script src="../../скрипты/q2-data-{data}.js?v=q2-2026-11-01-15"></script>
  <script src="../../скрипты/lesson-icons.js?v=flaticon-2026-11-01-v15"></script>
  <script src="../../скрипты/lessons.js?v=auth-cloud-20261101-v7"></script>
</body>
</html>
"""

# (папка, класс, префикс id, data-файл, число уроков, названия уроков)
GROUPS = [
    ("9 класс/2 четверть", "9 класс", "9", "9", 8, [
        "Логические операции",
        "Построение таблиц истинности",
        "Построение таблиц истинности",
        "Логические элементы ПК",
        "Логические элементы ПК",
        "Построение логических схем. СОР №2",
        "Построение логических схем. СОР №2",
        "Логические и вероятностные принципы вычислительных систем",
    ]),
    ("10 ЕМН/2 четверть", "10 ЕМН", "10emn", "10emn", 16, [
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Рекурсия",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "СОР №2. Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "СОЧ",
        "Алгоритмы сортировки",
    ]),
    ("10 ОГН/2 четверть", "10 ОГН", "10ogn", "10ogn", 8, [
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Алгоритмы сортировки",
        "Проектная деятельность: классификация данных. СОР №2",
        "Проектная деятельность: классификация данных. СОР №2",
    ]),
    ("11 класс/2 четверть", "11 класс", "11", "11", 8, [
        "Теория графов",
        "Теория графов",
        "Поиск кратчайшего пути",
        "Поиск кратчайшего пути",
        "Поиск кратчайшего пути",
        "Обход графа. СОР №2",
        "Обход графа. СОР №2",
        "Обход графа. СОР №2",
    ]),
]


def main() -> None:
    made = 0
    summary = {}
    for folder, cls, slug, data, count, titles in GROUPS:
        target = ROOT / folder
        target.mkdir(parents=True, exist_ok=True)
        for index in range(1, count + 1):
            title = titles[index - 1]
            lesson_id = f"{slug}-q2-{index}"
            html = SHELL.format(cls=cls, num=index, title=title, slug=lesson_id,
                                lesson_id=lesson_id, data=data)
            (target / f"{index} урок.html").write_text(html, encoding="utf-8")
            made += 1
        summary[slug] = count
    print(f"создано страниц: {made}")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
