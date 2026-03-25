# Content Model — ЮгТур

## Основная сущность: Tour

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Уникальный идентификатор |
| `slug` | `string` | URL-слаг тура |
| `title` | `string` | Название тура |
| `shortDescription` | `string` | Краткое описание (1–2 предложения) |
| `fullDescription` | `string` | Полное описание тура |
| `departureCities` | `DepartureCity[]` | Города выезда |
| `destination` | `string` | Направление (Архыз, Домбай и т.д.) |
| `region` | `string` | Регион (Кавказ, Крым, Абхазия) |
| `durationDays` | `number` | Длительность в днях |
| `seasonMonths` | `number[]` | Месяцы проведения (1–12) |
| `priceFrom` | `number` | Цена от (₽) |
| `oldPrice` | `number \| null` | Старая цена, если есть скидка |
| `nextDates` | `TourDate[]` | Ближайшие даты проведения |
| `included` | `string[]` | Что включено в стоимость |
| `excluded` | `string[]` | Что не включено |
| `itinerary` | `ItineraryDay[]` | Маршрут по дням |
| `gallery` | `string[]` | Пути к изображениям |
| `badges` | `Badge[]` | Бейджи: Хит, Новинка, Горящий и т.д. |
| `transport` | `string` | Тип транспорта |
| `meals` | `string` | Питание |
| `hotel` | `string` | Проживание |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | Сложность маршрута |
| `seoTitle` | `string` | SEO title |
| `seoDescription` | `string` | SEO description |

---

## Вложенные типы

### DepartureCity
| Поле | Тип | Описание |
|---|---|---|
| `city` | `string` | Название города |
| `slug` | `string` | URL-слаг города |

### TourDate
| Поле | Тип | Описание |
|---|---|---|
| `start` | `string` | Дата начала (ISO) |
| `end` | `string` | Дата окончания (ISO) |
| `price` | `number` | Цена на эту дату |
| `seatsLeft` | `number` | Осталось мест |

### ItineraryDay
| Поле | Тип | Описание |
|---|---|---|
| `day` | `number` | Номер дня |
| `title` | `string` | Заголовок дня |
| `description` | `string` | Описание программы дня |

### Badge
Строковый тип: `'hit' | 'new' | 'hot' | 'kids' | 'weekend' | 'sea' | 'mountains'`

Отображение:
| Значение | Метка | Цвет |
|---|---|---|
| `hit` | Хит | Оранжевый |
| `new` | Новинка | Синий |
| `hot` | Горящий | Красный |
| `kids` | С детьми | Зелёный |
| `weekend` | Выходные | Фиолетовый |
| `sea` | Море | Голубой |
| `mountains` | Горы | Зелёный |

---

## Сущность: City (город выезда)

| Поле | Тип | Описание |
|---|---|---|
| `name` | `string` | Название города |
| `slug` | `string` | URL-слаг |
| `description` | `string` | SEO-текст о турах из этого города |
| `tourCount` | `number` | Количество доступных туров (вычисляемое) |

---

## Сущность: Destination (направление)

| Поле | Тип | Описание |
|---|---|---|
| `name` | `string` | Название направления |
| `slug` | `string` | URL-слаг |
| `region` | `string` | Регион |
| `description` | `string` | Описание направления |
| `image` | `string` | Изображение-обложка |

---

## Сущность: Collection (подборка)

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Идентификатор |
| `slug` | `string` | URL-слаг |
| `title` | `string` | Название подборки |
| `description` | `string` | Описание |
| `tourIds` | `string[]` | ID туров в подборке |

---

## Сущность: Review (отзыв)

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Идентификатор |
| `author` | `string` | Имя автора |
| `city` | `string` | Город автора |
| `tourSlug` | `string` | Слаг тура |
| `rating` | `number` | Оценка (1–5) |
| `text` | `string` | Текст отзыва |
| `date` | `string` | Дата отзыва |

---

## Сущность: FAQ

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Идентификатор |
| `question` | `string` | Вопрос |
| `answer` | `string` | Ответ |
| `tourSlug` | `string \| null` | Привязка к конкретному туру (опционально) |

---

## Связи между сущностями

```
Tour ──┬── DepartureCity[] (города выезда)
       ├── TourDate[] (даты)
       ├── ItineraryDay[] (маршрут)
       ├── Badge[] (метки)
       └── Review[] (отзывы, связь через tourSlug)

City ──── Tour[] (вычисляемое: все туры, где city в departureCities)

Destination ──── Tour[] (вычисляемое: все туры с этим направлением)

Collection ──── Tour[] (явная связь через tourIds)
```
