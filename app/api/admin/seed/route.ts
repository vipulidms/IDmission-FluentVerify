import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sets = [
  {
    language: 'english',
    level: 'B2',
    sec1Topic: 'Describe a memorable journey you have taken. Where did you go, who were you with, and why was it so special?',
    sec1FollowUp1: 'How do you think travelling to new places impacts a person\'s worldview?',
    sec1FollowUp2: 'Some people prefer to travel alone rather than in a group. What are the advantages and disadvantages of solo travel?',
    sec2Topic: 'Discuss the role of technology in modern education. Has it improved the learning experience?',
    sec3Paragraph: 'The rapid advancement of digital technology has profoundly altered how we communicate, work, and learn. While some argue that constant connectivity leads to distraction and a decrease in deep, focused thought, others highlight the unprecedented access to global information and collaborative opportunities it provides. Balancing screen time with offline activities has become a crucial skill in the modern era.'
  },
  {
    language: 'english',
    level: 'B1',
    sec1Topic: 'Tell me about your favourite book or movie. What is the plot and why do you like it so much?',
    sec1FollowUp1: 'Do you prefer reading books or watching movies? Why?',
    sec1FollowUp2: 'How has the way we consume entertainment changed over the last ten years?',
    sec2Topic: 'Describe your ideal workplace. What qualities make a good work environment?',
    sec3Paragraph: 'A healthy lifestyle involves more than just eating well and exercising regularly. It also encompasses mental well-being, adequate sleep, and managing stress effectively. Many people find that spending time in nature or engaging in creative hobbies helps them maintain a balanced life, reducing the risk of burnout.'
  },
  {
    language: 'english',
    level: 'C1',
    sec1Topic: 'Discuss a major environmental challenge facing the world today. What are its causes and potential solutions?',
    sec1FollowUp1: 'To what extent should governments regulate industries to protect the environment?',
    sec1FollowUp2: 'Can individual actions, like recycling or reducing meat consumption, make a significant difference globally?',
    sec2Topic: 'The concept of work-life balance is evolving. How do remote work and flexible hours influence our productivity and mental health?',
    sec3Paragraph: 'Urbanization continues at an unprecedented pace, transforming vast landscapes into sprawling metropolises. This shift presents immense logistical challenges, from developing sustainable infrastructure to managing resource distribution efficiently. Yet, cities remain vibrant hubs of cultural exchange and innovation, drawing millions in search of better economic opportunities.'
  },
  {
    language: 'english',
    level: 'A2',
    sec1Topic: 'Describe a typical weekend in your life. What do you usually do from Saturday morning to Sunday evening?',
    sec1FollowUp1: 'Do you prefer spending your weekends indoors or outdoors? Why?',
    sec1FollowUp2: 'How is your weekend different from your weekdays?',
    sec2Topic: 'Talk about a skill you would like to learn in the future, such as playing an instrument or learning a new language.',
    sec3Paragraph: 'Breakfast is often called the most important meal of the day. Eating a healthy meal in the morning can give you the energy you need to concentrate at school or work. Popular breakfast foods include cereal, toast, eggs, and fruit.'
  },
  {
    language: 'english',
    level: 'B2',
    sec1Topic: 'Many people nowadays prefer shopping online rather than going to physical stores. Describe your own shopping habits.',
    sec1FollowUp1: 'What are the main risks associated with e-commerce and online shopping?',
    sec1FollowUp2: 'How do you think physical retail stores can survive in the age of digital shopping?',
    sec2Topic: 'Some argue that learning a second language is no longer necessary due to translation software. Do you agree or disagree?',
    sec3Paragraph: 'Renewable energy sources, such as solar and wind power, are becoming increasingly vital as the world seeks to reduce its reliance on fossil fuels. Transitioning to green energy not only helps mitigate climate change but also stimulates economic growth by creating new industries and jobs in the technology sector.'
  },
  {
    language: "german",
    level: "A1",
    sec1Topic: "Stelle dich bitte vor. Wie heißt du, woher kommst du und wie alt bist du?",
    sec1FollowUp1: "Was machst du gerne in deiner Freizeit?",
    sec1FollowUp2: "Was ist dein Lieblingsessen und warum?",
    sec2Topic: "Erzähle mir von deiner Familie oder deinen Freunden.",
    sec3Paragraph: "Hallo, ich bin Anna. Ich wohne in Berlin. Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte. Am Wochenende treffe ich oft meine Freunde und wir gehen zusammen ins Kino oder essen eine Pizza."
  },
  {
    language: "german",
    level: "A2",
    sec1Topic: "Beschreibe deinen normalen Tagesablauf. Wann stehst du auf und was machst du am Morgen?",
    sec1FollowUp1: "Wie fährst du normalerweise zur Arbeit oder zur Schule?",
    sec1FollowUp2: "Was machst du am Abend, bevor du schlafen gehst?",
    sec2Topic: "Erzähle mir von deinem letzten Urlaub. Wo warst du und wie war das Wetter?",
    sec3Paragraph: "Letztes Jahr bin ich mit meiner Familie nach Italien gereist. Das Wetter war wunderschön und sehr warm. Wir haben jeden Tag im Meer gebadet und viel Eis gegessen. Die Reise mit dem Zug war ein bisschen lang, aber wir hatten sehr viel Spaß."
  },
  {
    language: "german",
    level: "B1",
    sec1Topic: "Welche Rolle spielen soziale Netzwerke und das Internet in deinem Leben?",
    sec1FollowUp1: "Glaubst du, dass wir heute zu viel Zeit am Smartphone verbringen? Warum?",
    sec1FollowUp2: "Wie hast du das Internet genutzt, als du ein Kind warst, im Vergleich zu heute?",
    sec2Topic: "Beschreibe ein Fest oder eine Tradition aus deinem Heimatland, die dir wichtig ist.",
    sec3Paragraph: "In der modernen Gesellschaft hat sich die Art der Kommunikation stark verändert. Früher schrieben die Menschen Briefe oder telefonierten vom Festnetz aus. Heute können wir jederzeit über das Smartphone mit Freunden auf der ganzen Welt Nachrichten austauschen oder Videotelefonate führen. Das bringt viele Vorteile, kann aber auch anstrengend sein."
  },
  {
    language: "german",
    level: "B2",
    sec1Topic: "Diskutiere die Vor- und Nachteile von Homeoffice im Vergleich zur Arbeit im Büro.",
    sec1FollowUp1: "Wie wichtig ist der direkte persönliche Kontakt zu Kollegen für die Produktivität?",
    sec1FollowUp2: "Welche Eigenschaften muss ein Mitarbeiter haben, um im Homeoffice erfolgreich zu sein?",
    sec2Topic: "Umweltschutz im Alltag: Welche konkreten Maßnahmen ergreifst du, um die Umwelt zu schonen, und warum?",
    sec3Paragraph: "Der Klimawandel ist eine der größten Herausforderungen unserer Zeit. Um die Erderwärmung zu stoppen, müssen wir nicht nur auf erneuerbare Energien umsteigen, sondern auch unseren Konsum kritisch hinterfragen. Jeder Einzelne kann durch bewusste Entscheidungen im Alltag, wie die Nutzung öffentlicher Verkehrsmittel oder die Vermeidung von Plastikmüll, einen wertvollen Beitrag zum Schutz unseres Planeten leisten."
  },
  {
    language: "german",
    level: "C1",
    sec1Topic: "Künstliche Intelligenz wird zunehmend in verschiedenen Branchen eingesetzt. Welche gesellschaftlichen und wirtschaftlichen Auswirkungen erwartest du in den nächsten zehn Jahren?",
    sec1FollowUp1: "Wie können wir sicherstellen, dass KI-Technologien ethisch vertretbar entwickelt und eingesetzt werden?",
    sec1FollowUp2: "Inwiefern sollte der Staat eingreifen, um Arbeitnehmer abzusichern, deren Jobs durch KI automatisiert werden könnten?",
    sec2Topic: "Analysiere den Einfluss der Globalisierung auf die kulturelle Identität von Nationalstaaten.",
    sec3Paragraph: "Die stetig voranschreitende Automatisierung und Digitalisierung zwingt uns dazu, traditionelle Bildungs- und Wirtschaftsmodelle radikal zu überdenken. Lebenslanges Lernen ist nicht mehr nur eine hohle Phrase, sondern eine zwingende Voraussetzung, um auf einem dynamischen und stark umkämpften Arbeitsmarkt bestehen zu können. Daher sind flexible Weiterbildungsangebote in allen Gesellschaftsschichten von essenzieller Bedeutung."
  }
];

export async function GET() {
  try {
    let seeded = false;

    const englishCount = await prisma.speakingQuestionSet.count({ where: { language: 'english' } });
    if (englishCount === 0) {
      const englishSets = sets.filter(s => s.language === 'english');
      for (const qSet of englishSets) {
        await prisma.speakingQuestionSet.create({ data: qSet });
      }
      seeded = true;
    }

    const germanCount = await prisma.speakingQuestionSet.count({ where: { language: 'german' } });
    if (germanCount === 0) {
      const germanSets = sets.filter(s => s.language === 'german');
      for (const qSet of germanSets) {
        await prisma.speakingQuestionSet.create({ data: qSet });
      }
      seeded = true;
    }

    if (!seeded) {
      return NextResponse.json({ message: "Database already seeded with both English and German!" }, { status: 200 });
    }

    return NextResponse.json({ message: "Successfully seeded missing questions into the database!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
