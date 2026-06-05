const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const germanQuestionSets = [
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

async function main() {
  console.log('Clearing old German sets...');
  await prisma.speakingQuestionSet.deleteMany({
    where: { language: 'german' }
  });

  console.log('Inserting new German sets...');
  for (const set of germanQuestionSets) {
    await prisma.speakingQuestionSet.create({
      data: set
    });
    console.log(`Created German ${set.level} question set.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
