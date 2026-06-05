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
  }
];

export async function GET() {
  try {
    const existingCount = await prisma.speakingQuestionSet.count();
    if (existingCount > 0) {
      return NextResponse.json({ message: "Database already seeded!" }, { status: 200 });
    }

    for (const qSet of sets) {
      await prisma.speakingQuestionSet.create({
        data: qSet
      });
    }

    return NextResponse.json({ message: "Successfully seeded the database!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
