import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Inclusive World demo data...");

  // Clear existing data (dev only)
  await prisma.notification.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lessonStepProgress.deleteMany();
  await prisma.lessonStep.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Johnson",
      email: "teacher@inclusiveworld.org",
      passwordHash,
      role: "TEACHER",
      lastLogin: new Date(),
    },
  });

  const emily = await prisma.user.create({
    data: {
      name: "Emily Chen",
      email: "emily@inclusiveworld.org",
      passwordHash,
      role: "TEACHER",
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });

  const alex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "student@inclusiveworld.org",
      passwordHash,
      role: "STUDENT",
      lastLogin: new Date(),
    },
  });

  const students = await Promise.all(
    [
      "Maya Patel",
      "Liam O'Brien",
      "Sofia Garcia",
      "Noah Kim",
      "Ava Thompson",
    ].map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `${name.split(" ")[0].toLowerCase()}@inclusiveworld.org`,
          passwordHash,
          role: "STUDENT",
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * (i + 2)),
        },
      })
    )
  );

  const classroom = await prisma.classroom.create({
    data: {
      name: "Python Programming",
      subject: "Computer Science",
      emoji: "🐍",
      color: "#3b6fb0",
      joinCode: "PYTHN234",
      createdById: sarah.id,
    },
  });

  // Memberships: Sarah is Admin, Emily is a Teacher (active),
  // Michael Lee is a pending teacher invite, students are enrolled.
  await prisma.membership.create({
    data: {
      userId: sarah.id,
      classroomId: classroom.id,
      roleInClass: "ADMIN",
      status: "ACTIVE",
      lastActiveAt: new Date(),
    },
  });
  await prisma.membership.create({
    data: {
      userId: emily.id,
      classroomId: classroom.id,
      roleInClass: "TEACHER",
      status: "ACTIVE",
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });
  await prisma.membership.create({
    data: {
      classroomId: classroom.id,
      roleInClass: "TEACHER",
      status: "PENDING_INVITE",
      invitedEmail: "michael.lee@inclusiveworld.org",
    },
  });

  const allStudents = [alex, ...students];
  await Promise.all(
    allStudents.map((s) =>
      prisma.membership.create({
        data: {
          userId: s.id,
          classroomId: classroom.id,
          roleInClass: "STUDENT",
          status: "ACTIVE",
          lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        },
      })
    )
  );

  // Every lesson gets the same gentle four-step rhythm: read, try, practise,
  // turn in. Consistency is the point — students learn the shape once.
  const defaultSteps = [
    "Open the lesson and read each part slowly.",
    "Try the example yourself.",
    "Finish the practice task.",
    "Turn in your work when you feel ready.",
  ];

  const lessonData = [
    { title: "Introduction", description: "Welcome to Python! What it is and why it matters.", estimatedMinutes: 15 },
    { title: "Variables & Data Types", description: "Storing and labeling information in Python.", estimatedMinutes: 20 },
    { title: "Control Flow", description: "Making decisions with if/else and loops.", estimatedMinutes: 25 },
    { title: "Functions", description: "Learn how functions work in Python, why they are useful, and how to create your own functions.", estimatedMinutes: 30 },
    { title: "Asking Questions with input()", description: "Read each part slowly. Try the example. Then finish the practice task and turn it in when you feel ready.", estimatedMinutes: 20 },
    { title: "Lists", description: "Working with ordered collections of items.", estimatedMinutes: 25 },
    { title: "Dictionaries", description: "Key–value pairs for structured data.", estimatedMinutes: 25 },
    { title: "Modules", description: "Reusing and organizing code across files.", estimatedMinutes: 20 },
  ];

  const lessons = [];
  for (let i = 0; i < lessonData.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        classroomId: classroom.id,
        title: lessonData[i].title,
        description: lessonData[i].description,
        estimatedMinutes: lessonData[i].estimatedMinutes,
        order: i,
        steps: {
          create: defaultSteps.map((text, order) => ({ text, order })),
        },
      },
    });
    lessons.push(lesson);
  }

  // Alex has completed the first 3 lessons (matches the screenshots).
  for (let i = 0; i < 3; i++) {
    await prisma.lessonProgress.create({
      data: {
        lessonId: lessons[i].id,
        userId: alex.id,
        completed: true,
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * (72 - i * 24)),
      },
    });
  }

  const assignment = await prisma.assignment.create({
    data: {
      classroomId: classroom.id,
      title: "Function Practice",
      description:
        "Write three Python functions: greet(name), add(a, b), and is_even(n). Submit a link to your code (Google Doc, Colab, or Gist).",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      points: 100,
    },
  });

  // Two more so the student To-do list shows a range of urgencies.
  await prisma.assignment.create({
    data: {
      classroomId: classroom.id,
      title: "Asking Questions with input()",
      description: "Talk to the person using your program",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      points: 50,
    },
  });
  await prisma.assignment.create({
    data: {
      classroomId: classroom.id,
      title: "Lists Practice",
      description: "Show the right items in the right order",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
      points: 50,
    },
  });

  const functionsQuiz = await prisma.quiz.create({
    data: {
      classroomId: classroom.id,
      title: "Quiz 2: Functions",
      description: "Check your understanding of Python functions.",
      questions: JSON.stringify([
        {
          prompt: "Which keyword defines a function in Python?",
          options: ["func", "def", "function", "lambda"],
          answerIndex: 1,
        },
        {
          prompt: "What does a function use to send a value back to the caller?",
          options: ["print", "return", "yield", "output"],
          answerIndex: 1,
        },
        {
          prompt: "What are the values you pass into a function called?",
          options: ["arguments", "returns", "variables", "modules"],
          answerIndex: 0,
        },
      ]),
    },
  });

  // --- Scoring feature demo data -------------------------------------
  // Two more classrooms plus graded work across all three, so /scores,
  // the dashboard grade card, and My Buddy's encouragement flow all have
  // something real to react to. Algebra I is deliberately the class that
  // just dipped, so there's something for the pet-encouragement preview
  // to notice.
  const daysAgo = (n: number) => new Date(Date.now() - 1000 * 60 * 60 * 24 * n);
  const inDays = (n: number) => new Date(Date.now() + 1000 * 60 * 60 * 24 * n);

  const algebra = await prisma.classroom.create({
    data: {
      name: "Algebra I",
      subject: "Math",
      emoji: "➗",
      color: "#2f9e5c",
      joinCode: "ALGB5678",
      createdById: sarah.id,
    },
  });
  const creativeWriting = await prisma.classroom.create({
    data: {
      name: "Creative Writing",
      subject: "English",
      emoji: "✍️",
      color: "#a855f7",
      joinCode: "WRITE9012",
      createdById: emily.id,
    },
  });

  for (const extra of [algebra, creativeWriting]) {
    await prisma.membership.create({
      data: {
        userId: extra.createdById,
        classroomId: extra.id,
        roleInClass: "ADMIN",
        status: "ACTIVE",
        lastActiveAt: new Date(),
      },
    });
    await Promise.all(
      allStudents.map((s) =>
        prisma.membership.create({
          data: {
            userId: s.id,
            classroomId: extra.id,
            roleInClass: "STUDENT",
            status: "ACTIVE",
            lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
          },
        })
      )
    );
  }

  // Python Programming: Alex trending up (83 -> 91, avg 87%).
  const variablesQuiz = await prisma.quiz.create({
    data: {
      classroomId: classroom.id,
      title: "Variables & Data Types Quiz",
      description: "Check your understanding of variables and data types.",
      questions: JSON.stringify([
        {
          prompt: "Which of these is a valid variable name?",
          options: ["2cool", "my_var", "my-var", "class"],
          answerIndex: 1,
        },
        {
          prompt: "What type is the value 3.14?",
          options: ["int", "float", "str", "bool"],
          answerIndex: 1,
        },
      ]),
    },
  });
  await prisma.quizAttempt.create({
    data: {
      quizId: variablesQuiz.id,
      userId: alex.id,
      answers: JSON.stringify([1, 1]),
      score: 83,
      completedAt: daysAgo(12),
    },
  });
  await prisma.quizAttempt.create({
    data: {
      quizId: functionsQuiz.id,
      userId: alex.id,
      answers: JSON.stringify([1, 1, 0]),
      score: 91,
      completedAt: daysAgo(2),
    },
  });

  // Algebra I: a lesson Alex hasn't finished, and a dip from 82 -> 70
  // (avg 76%) that My Buddy should react to.
  await prisma.lesson.create({
    data: {
      classroomId: algebra.id,
      title: "Solving for X",
      description: "Isolating the variable in one and two-step equations.",
      estimatedMinutes: 8,
      order: 0,
    },
  });
  await prisma.assignment.create({
    data: {
      classroomId: algebra.id,
      title: "Linear Equations Worksheet",
      description: "Solve for x in each equation and show your work.",
      dueDate: new Date(),
      points: 50,
    },
  });
  const slopeBasics = await prisma.assignment.create({
    data: {
      classroomId: algebra.id,
      title: "Slope Basics",
      description: "Find the slope between two points.",
      dueDate: daysAgo(9),
      points: 100,
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: slopeBasics.id,
      userId: alex.id,
      linkUrl: "https://docs.google.com/document/d/demo-slope-basics",
      grade: 82,
      feedback: "Nice work showing each step!",
      submittedAt: daysAgo(8),
    },
  });
  const linearEquationsQuiz = await prisma.quiz.create({
    data: {
      classroomId: algebra.id,
      title: "Linear Equations Quiz",
      description: "Check your understanding of solving for x.",
      questions: JSON.stringify([
        {
          prompt: "Solve for x: 2x + 4 = 10",
          options: ["2", "3", "6", "7"],
          answerIndex: 1,
        },
        {
          prompt: "Solve for x: x - 5 = -2",
          options: ["-7", "-3", "3", "7"],
          answerIndex: 2,
        },
      ]),
    },
  });
  await prisma.quizAttempt.create({
    data: {
      quizId: linearEquationsQuiz.id,
      userId: alex.id,
      answers: JSON.stringify([0, 1]),
      score: 70,
      completedAt: new Date(),
    },
  });

  // Creative Writing: steady-to-strong, including a perfect quiz score.
  const poemResponse = await prisma.assignment.create({
    data: {
      classroomId: creativeWriting.id,
      title: "Poem Response",
      description: "Write a one-paragraph response to the assigned poem.",
      dueDate: daysAgo(20),
      points: 100,
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: poemResponse.id,
      userId: alex.id,
      text: "The poem reminded me of the first time I saw the ocean...",
      grade: 84,
      feedback: "Thoughtful connections — nice job!",
      submittedAt: daysAgo(14),
    },
  });
  const grammarQuiz = await prisma.quiz.create({
    data: {
      classroomId: creativeWriting.id,
      title: "Grammar Basics Quiz",
      description: "Check your understanding of grammar basics.",
      questions: JSON.stringify([
        {
          prompt: "Which word is a noun?",
          options: ["quickly", "jump", "kitchen", "blue"],
          answerIndex: 2,
        },
        {
          prompt: "Which sentence uses correct punctuation?",
          options: ["Its raining.", "It's raining.", "Its' raining.", "Its raining"],
          answerIndex: 1,
        },
      ]),
    },
  });
  await prisma.quizAttempt.create({
    data: {
      quizId: grammarQuiz.id,
      userId: alex.id,
      answers: JSON.stringify([2, 1]),
      score: 100,
      completedAt: daysAgo(3),
    },
  });
  await prisma.assignment.create({
    data: {
      classroomId: creativeWriting.id,
      title: "Short Story Draft",
      description: "Turn in the first draft of your short story.",
      dueDate: inDays(7),
      points: 100,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: "assignment",
        message: 'New assignment: "Function Practice" is due in 3 days.',
        link: `/classroom/${classroom.id}/assignments`,
      },
      {
        userId: alex.id,
        type: "lesson",
        message: 'Lesson 4 "Functions" is now available.',
        link: `/classroom/${classroom.id}/lessons`,
      },
      {
        userId: sarah.id,
        type: "people",
        message: "Michael Lee has a pending teacher invite.",
        link: `/classroom/${classroom.id}/people`,
      },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("\nDemo logins (password: password123):");
  console.log("  Teacher/Admin: teacher@inclusiveworld.org");
  console.log("  Teacher:       emily@inclusiveworld.org");
  console.log("  Student:       student@inclusiveworld.org");
  console.log("\nPython Programming join code: PYTHN234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
