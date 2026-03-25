const steps = [
  {
    number: '01',
    title: 'Выберите направление',
    description: 'Смотрите маршруты, длительность, даты и формат поездки.',
  },
  {
    number: '02',
    title: 'Оставьте заявку или забронируйте место',
    description: 'Напишите нам — поможем сориентироваться по поездке и уточнить ключевые детали.',
  },
  {
    number: '03',
    title: 'Подтвердите детали',
    description: 'Формат, даты, условия и организационные моменты согласовываются заранее.',
  },
  {
    number: '04',
    title: 'Отправляйтесь в путешествие',
    description: 'Остаётся только собраться и поехать за впечатлениями.',
  },
];

export default function HowItWorks() {
  return (
    <section id="kak-bronirovat" className="py-20 lg:py-28 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Поехать проще, чем кажется
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Весь процесс — через нас. Выбирайте маршрут, бронируйте и отправляйтесь.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 mb-5">
                <span className="text-xl font-extrabold text-brand-600">{step.number}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t border-brand-200/50" />
              )}
              <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
