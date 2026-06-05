export const englishWritingPrompts = [
  {
    id: "en-w-1",
    level: "A2",
    title: "My Daily Routine",
    prompt: "Describe your typical daily routine. What do you do from morning to evening? Include at least 5 activities.",
    minWords: 80,
    maxWords: 150,
  },
  {
    id: "en-w-2",
    level: "B1",
    title: "Technology in Daily Life",
    prompt: "How has technology changed the way we communicate with each other? Give specific examples and discuss both positive and negative effects.",
    minWords: 150,
    maxWords: 250,
  },
  {
    id: "en-w-3",
    level: "B2",
    title: "Environmental Responsibility",
    prompt: "To what extent do you agree that individuals have a greater responsibility than governments in protecting the environment? Justify your opinion with examples.",
    minWords: 200,
    maxWords: 350,
  },
  {
    id: "en-w-4",
    level: "C1",
    title: "Remote Work Revolution",
    prompt: "The COVID-19 pandemic accelerated the shift to remote work. Critically analyse the long-term implications of this trend for urban development, work-life balance, and social cohesion.",
    minWords: 300,
    maxWords: 450,
  },
];

export const germanWritingPrompts = [
  {
    id: "de-w-1",
    level: "A2",
    title: "Meine Familie",
    prompt: "Beschreibe deine Familie. Wie heißen deine Familienmitglieder? Was machen sie gerne? Schreibe mindestens 5 Sätze.",
    minWords: 60,
    maxWords: 120,
  },
  {
    id: "de-w-2",
    level: "B1",
    title: "Leben in der Stadt oder auf dem Land",
    prompt: "Möchtest du lieber in einer Stadt oder auf dem Land leben? Erkläre deine Meinung und nenne Vor- und Nachteile beider Optionen.",
    minWords: 120,
    maxWords: 220,
  },
  {
    id: "de-w-3",
    level: "B2",
    title: "Soziale Medien und Gesellschaft",
    prompt: "Inwiefern beeinflussen soziale Medien das gesellschaftliche Leben und die zwischenmenschlichen Beziehungen? Diskutieren Sie Chancen und Risiken mit konkreten Beispielen.",
    minWords: 180,
    maxWords: 320,
  },
  {
    id: "de-w-4",
    level: "C1",
    title: "Klimawandel und Politik",
    prompt: "Analysieren Sie kritisch, ob die aktuellen politischen Maßnahmen zur Bekämpfung des Klimawandels ausreichen. Berücksichtigen Sie dabei wirtschaftliche, soziale und ökologische Aspekte.",
    minWords: 280,
    maxWords: 420,
  },
];

export const englishReadingPassages = [
  {
    id: "en-r-1",
    level: "B1",
    title: "The Rise of Urban Farming",
    passage: `Urban farming is transforming cities around the world. From rooftop gardens in New York to vertical farms in Tokyo, people are finding innovative ways to grow food in urban environments.

The benefits are numerous. Urban farms can reduce food miles – the distance food travels from farm to plate – which cuts carbon emissions and ensures fresher produce reaches consumers. They also create community spaces where neighbours can meet and collaborate.

However, urban farming faces significant challenges. Land in cities is expensive, and many urban farmers struggle to make their operations financially viable. Water usage is another concern, though new hydroponic systems are addressing this by using up to 90% less water than traditional farming.

Despite these obstacles, the urban farming movement continues to grow. Advocates argue that as cities expand and climate change threatens traditional agriculture, urban farms could become an essential part of our food system.`,
    questions: [
      {
        id: "q1",
        question: "What is the main benefit of urban farming mentioned in terms of the environment?",
        type: "short",
        correctAnswer: "Reducing food miles and carbon emissions",
      },
      {
        id: "q2",
        question: "According to the text, how much less water do hydroponic systems use compared to traditional farming?",
        type: "mcq",
        options: ["50% less", "70% less", "90% less", "95% less"],
        correctAnswer: "90% less",
      },
      {
        id: "q3",
        question: "What is described as the biggest challenge for urban farmers?",
        type: "short",
        correctAnswer: "High cost of land / financial viability",
      },
      {
        id: "q4",
        question: "In your own words, explain why the author thinks urban farming may become essential in the future.",
        type: "short",
        correctAnswer: "Because cities are expanding and climate change threatens traditional agriculture",
      },
    ],
  },
];

export const germanReadingPassages = [
  {
    id: "de-r-1",
    level: "B1",
    title: "Die Digitalisierung der Arbeitswelt",
    passage: `Die Digitalisierung verändert die Arbeitswelt grundlegend. Immer mehr Tätigkeiten werden durch Computer und Algorithmen übernommen, während neue Berufsfelder entstehen, die vor wenigen Jahren noch unbekannt waren.

Besonders betroffen sind Berufe mit repetitiven Aufgaben. Kassierer, Sachbearbeiter und einfache Buchhalter sehen sich durch Automatisierung bedroht. Eine Studie des Instituts für Arbeitsmarkt- und Berufsforschung zeigt, dass etwa 25 Prozent aller deutschen Arbeitsplätze durch Digitalisierung gefährdet sein könnten.

Gleichzeitig entstehen neue Chancen. IT-Spezialisten, Datenwissenschaftler und KI-Trainer werden dringend gesucht. Unternehmen investieren stark in Umschulungsprogramme, um ihre Mitarbeiter fit für die digitale Zukunft zu machen.

Experten sind sich einig: Lebenslangres Lernen wird in der digitalen Ära unverzichtbar sein. Wer sich anpassen und neue Fähigkeiten erwerben kann, wird auch in Zukunft gute Chancen auf dem Arbeitsmarkt haben.`,
    questions: [
      {
        id: "q1",
        question: "Welche Berufe sind laut dem Text am stärksten von der Automatisierung bedroht?",
        type: "short",
        correctAnswer: "Berufe mit repetitiven/sich wiederholenden Aufgaben wie Kassierer, Sachbearbeiter",
      },
      {
        id: "q2",
        question: "Wie viel Prozent der deutschen Arbeitsplätze könnten gefährdet sein?",
        type: "mcq",
        options: ["15 Prozent", "20 Prozent", "25 Prozent", "30 Prozent"],
        correctAnswer: "25 Prozent",
      },
      {
        id: "q3",
        question: "Was machen Unternehmen, um ihre Mitarbeiter auf die digitale Zukunft vorzubereiten?",
        type: "short",
        correctAnswer: "Sie investieren in Umschulungsprogramme",
      },
      {
        id: "q4",
        question: "Was ist laut Experten in der digitalen Ära unverzichtbar?",
        type: "short",
        correctAnswer: "Lebenslanges Lernen",
      },
    ],
  },
];

export const listeningContent = {
  english: [
    {
      id: "en-l-1",
      level: "B1",
      title: "A Job Interview",
      transcript: `Interviewer: Good morning, Sarah. Thank you for coming in today. Please, have a seat.

Sarah: Thank you. I'm very pleased to be here.

Interviewer: I've read your CV and I'm impressed by your five years of experience in marketing. Can you tell me a bit more about your current role?

Sarah: Of course. I'm currently a Senior Marketing Coordinator at TechStart. I manage our social media channels, coordinate campaigns, and analyse the results. Last year, I led a campaign that increased our social media followers by 40 percent.

Interviewer: That's impressive. Why are you looking to leave your current position?

Sarah: I've learned a great deal at TechStart, but I'm looking for a new challenge and more opportunities for career growth. Your company's focus on data-driven marketing particularly excites me.

Interviewer: We do rely heavily on analytics. One final question – what are your salary expectations?

Sarah: Based on my experience and research into industry standards, I'm looking for something in the range of forty-five to fifty thousand pounds per year.

Interviewer: That's within our budget. We'll be in touch within the week.`,
      questions: [
        {
          id: "q1",
          question: "How many years of experience does Sarah have in marketing?",
          type: "mcq",
          options: ["Three years", "Four years", "Five years", "Six years"],
          correctAnswer: "Five years",
        },
        {
          id: "q2",
          question: "By what percentage did Sarah increase social media followers?",
          type: "short",
          correctAnswer: "40 percent",
        },
        {
          id: "q3",
          question: "What is Sarah's salary expectation?",
          type: "short",
          correctAnswer: "45,000 to 50,000 pounds per year",
        },
        {
          id: "q4",
          question: "Why is Sarah leaving her current job?",
          type: "short",
          correctAnswer: "She wants a new challenge and more career growth opportunities",
        },
      ],
    },
  ],
  german: [
    {
      id: "de-l-1",
      level: "B1",
      title: "Ein Gespräch über Urlaub",
      transcript: `Anna: Hallo Klaus! Wie war dein Urlaub in Spanien?

Klaus: Es war wunderschön! Wir haben zwei Wochen in Barcelona verbracht. Die Stadt ist unglaublich.

Anna: Was habt ihr alles gemacht?

Klaus: Am ersten Tag haben wir die Sagrada Família besichtigt – das war einfach atemberaubend. Dann sind wir täglich an den Strand gegangen. Das Wetter war perfekt, jeden Tag Sonnenschein und etwa 28 Grad.

Anna: Klingt fantastisch! Und das Essen?

Klaus: Oh, das Essen war köstlich! Wir haben viel Tapas gegessen und natürlich Paella. Es gibt ein kleines Restaurant nahe dem Hotel, das die beste Paella serviert, die ich je gegessen habe.

Anna: Hast du auch Ausflüge gemacht?

Klaus: Ja, wir haben einen Tagesausflug nach Montserrat gemacht. Das ist ein Kloster in den Bergen, etwa eine Stunde von Barcelona entfernt. Die Aussicht von oben war spektakulär.

Anna: Das klingt nach einem perfekten Urlaub. Ich bin ein bisschen neidisch!

Klaus: Du solltest Barcelona unbedingt besuchen. Ich kann es sehr empfehlen!`,
      questions: [
        {
          id: "q1",
          question: "Wie lange war Klaus in Spanien?",
          type: "mcq",
          options: ["Eine Woche", "Zwei Wochen", "Drei Wochen", "Einen Monat"],
          correctAnswer: "Zwei Wochen",
        },
        {
          id: "q2",
          question: "Wie war das Wetter in Barcelona?",
          type: "short",
          correctAnswer: "Sonnenschein, etwa 28 Grad",
        },
        {
          id: "q3",
          question: "Wohin hat Klaus einen Tagesausflug gemacht?",
          type: "short",
          correctAnswer: "Nach Montserrat",
        },
        {
          id: "q4",
          question: "Was isst Klaus besonders gerne in Spanien?",
          type: "short",
          correctAnswer: "Tapas und Paella",
        },
      ],
    },
  ],
};

export const speakingPrompts = {
  english: [
    {
      id: "en-s-1",
      level: "A2",
      title: "Describe Your Home",
      prompt: "Describe your home or the place where you live. What does it look like? What is your favourite room and why?",
      preparationTime: 30,
      speakingTime: 60,
    },
    {
      id: "en-s-2",
      level: "B1",
      title: "A Memorable Experience",
      prompt: "Tell me about a memorable experience from your past. What happened? Why do you remember it so well? How did it affect you?",
      preparationTime: 45,
      speakingTime: 90,
    },
    {
      id: "en-s-3",
      level: "B2",
      title: "Social Media Impact",
      prompt: "Discuss the impact of social media on modern relationships. Do you think social media brings people together or pushes them apart? Give reasons and examples to support your view.",
      preparationTime: 60,
      speakingTime: 120,
    },
    {
      id: "en-s-4",
      level: "C1",
      title: "Artificial Intelligence",
      prompt: "Critically evaluate the role of artificial intelligence in the modern workplace. Consider both the opportunities it presents and the ethical challenges it raises.",
      preparationTime: 60,
      speakingTime: 150,
    },
  ],
  german: [
    {
      id: "de-s-1",
      level: "A2",
      title: "Mein Lieblingsessen",
      prompt: "Erzähle mir von deinem Lieblingsessen. Was ist es? Wie wird es zubereitet? Und wann isst du es am liebsten?",
      preparationTime: 30,
      speakingTime: 60,
    },
    {
      id: "de-s-2",
      level: "B1",
      title: "Freizeit und Hobbys",
      prompt: "Beschreibe deine Freizeitaktivitäten und Hobbys. Was machst du gerne in deiner Freizeit? Warum sind diese Aktivitäten wichtig für dich?",
      preparationTime: 45,
      speakingTime: 90,
    },
    {
      id: "de-s-3",
      level: "B2",
      title: "Bildung im digitalen Zeitalter",
      prompt: "Diskutiere, wie sich die Digitalisierung auf das Bildungswesen auswirkt. Welche Chancen und Risiken siehst du beim digitalen Lernen?",
      preparationTime: 60,
      speakingTime: 120,
    },
    {
      id: "de-s-4",
      level: "C1",
      title: "Globalisierung und Kultur",
      prompt: "Analysiere den Einfluss der Globalisierung auf lokale Kulturen und Traditionen. Ist Globalisierung eine Bedrohung oder eine Chance für kulturelle Vielfalt?",
      preparationTime: 60,
      speakingTime: 150,
    },
  ],
};
