require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Lecture = require('./src/models/lecture.model');
const Transcript = require('./src/models/transcript.model');
const Notes = require('./src/models/notes.model');
const Flashcard = require('./src/models/flashcard.model');
const MCQ = require('./src/models/mcq.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/class_to_notes';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    // Clear existing data
    // console.log('Clearing existing data...');
    await User.deleteMany({});
    await Lecture.deleteMany({});
    await Transcript.deleteMany({});
    await Notes.deleteMany({});
    await Flashcard.deleteMany({});
    await MCQ.deleteMany({});
    // console.log('Existing database cleared.');

    // 1. Create Users
    console.log('Creating users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@classnotes.com',
      password: 'admin123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150&q=80'
    });

    const teacher = await User.create({
      name: 'Dr. Helen Carter',
      email: 'teacher@classnotes.com',
      password: 'teacher123',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=150&h=150&q=80'
    });

    const student = await User.create({
      name: 'Alex Mercer',
      email: 'student@classnotes.com',
      password: 'student123',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=150&h=150&q=80'
    });
    // console.log('Users created successfully.');

    // 2. Create Sample Lecture
    // console.log('Creating sample lecture...');
    const lecture = await Lecture.create({
      title: 'Introduction to Binary Search',
      description: 'Understanding search efficiency, sorted arrays, divide-and-conquer strategy, and logarithmic time complexity O(log N).',
      subject: 'Data Structures',
      teacherId: teacher._id,
      audioUrl: '/uploads/sample_lecture.mp3', // Mock file path
      duration: 320,
      status: 'completed'
    });

    // 3. Create Sample Transcript
    // console.log('Creating transcript...');
    const rawTranscript = `Umm, okay, today we are going to talk about Binary Search. So, if you have a sorted array, instead of searching elements one by one, which is linear search, we can check the middle element first. If the target is smaller than the middle element, we look in the left half. If it's larger, we look in the right half. This is a divide-and-conquer strategy. It cuts the search space in half at each step. So, instead of O(N) operations, we can do it in O(log N) time, which is much faster. Okay? Remember, the array must be sorted. That is a strict prerequisite!`;
    const cleanedTranscript = `Today we are going to discuss Binary Search. When searching for a target value within a sorted array, rather than using linear search (checking elements one by one), we can check the middle element first. If the target is smaller than the middle element, we restrict the search to the left half. If the target is larger, we search in the right half. This is a divide-and-conquer strategy that halves the search space at each step. Consequently, the time complexity is reduced from O(N) to O(log N). A strict prerequisite is that the input array must be sorted.`;
    
    await Transcript.create({
      lectureId: lecture._id,
      rawTranscript,
      cleanedTranscript
    });

    // 4. Create Sample Notes
    // console.log('Creating notes...');
    const noteContent = `# Introduction to Binary Search

## Introduction
Search algorithms are a fundamental building block of computer science. When looking for a specific value in a large database or array, the choice of search algorithm dramatically impacts performance.

## Definition
**Binary Search** is an efficient search algorithm that operates on a sorted array by repeatedly dividing the search space in half.

## Key Concepts
- **Sorted Array**: The input array must be sorted in ascending or descending order.
- **Midpoint**: The algorithm compares the target with the middle element.
- **Divide and Conquer**: The algorithm halves the search area at each iteration.

## Detailed Explanation
Unlike Linear Search, which traverses the array index-by-index in \(O(N)\) time, Binary Search isolates the target value by continuously calculating the mid-index and splitting the search space.

## Step-by-Step Working
1. Set pointer \`low\` to index 0, and pointer \`high\` to index \`length - 1\`.
2. Find the midpoint: \`mid = low + (high - low) / 2\`.
3. If \`arr[mid] == target\`, the element is found. Return the index.
4. If \`target < arr[mid]\`, set \`high = mid - 1\` (search left half).
5. If \`target > arr[mid]\`, set \`low = mid + 1\` (search right half).
6. Repeat steps 2-5. If \`low > high\`, the target is not in the array.

## Real-World Example
Searching for a name in a printed telephone directory is a classic analogy. You open the directory in the middle. If the name starts with a letter further down the alphabet, you discard the left half and repeat the process on the right half.

## Advantages
- **High Efficiency**: Runs in logarithmic time \(O(\log N)\).
- **Scale**: Finding an item in a list of 1 million items takes a maximum of 20 comparisons.

## Limitations
- **Sorted Data Required**: The array must be sorted. Sorting beforehand adds a computational cost of \(O(N \log N)\).
- **Contiguous Allocation**: Requires contiguous memory arrays for indexing.

## Interview Questions
1. Why does Binary Search require a sorted array?
2. How do you prevent integer overflow when calculating the midpoint in languages like Java or C++?
3. What is the difference in space complexity between iterative and recursive Binary Search?

## Summary
Binary Search is a classic divide-and-conquer algorithm that optimizes searching on sorted lists to \(O(\log N)\) time, forming the basis of database indexing.`;

    await Notes.create({
      lectureId: lecture._id,
      topic: 'Introduction to Binary Search',
      noteContent,
      summary: {
        short: 'Binary Search is an efficient searching algorithm that operates by repeatedly dividing a sorted array in half. It runs in O(log N) logarithmic time, making it significantly faster than O(N) linear search. The only strict prerequisite is that the input array must be sorted beforehand.',
        medium: 'Binary Search is a foundational search algorithm in computer science that runs in O(log N) time, compared to linear search which checks elements sequentially in O(N) time. The algorithm works by examining the middle element of a sorted array. If the target matches the midpoint, the search terminates. Otherwise, if the target is smaller, the search continues in the left sub-array; if larger, it proceeds in the right sub-array. This divide-and-conquer strategy requires the array to be sorted beforehand, which makes it ideal for static tables or database search indices.',
        detailed: 'This lecture introduces Binary Search, an optimal algorithm for locating a target value inside a sorted array. Unlike sequential linear search, which yields a time complexity of O(N) in the worst case, Binary Search runs in O(log N) logarithmic time by halving the search space at each iteration. It implements the divide-and-conquer paradigm. In each cycle, the index midpoint is computed. If the midpoint value matches the target, the index is returned. If the target is smaller, the upper search bounds are truncated; if larger, the lower bounds are advanced. The strict requirement of pre-sorted lists is a key constraint, making the algorithm highly effective for fast lookups on static datasets but less efficient if the data changes frequently and requires re-sorting.'
      },
      concepts: [
        { term: 'Binary Search', definition: 'A search algorithm that operates on a sorted array, halving the search interval in each step.' },
        { term: 'Linear Search', definition: 'A search method that checks each element of a list sequentially until a match is found.' },
        { term: 'Divide and Conquer', definition: 'An algorithm design paradigm that divides a problem into subproblems, solves them, and combines the results.' },
        { term: 'Logarithmic Time O(log N)', definition: 'A time complexity where the execution steps grow logarithmically as the input data scale increases.' }
      ]
    });

    // 5. Create Sample Flashcards
    // console.log('Creating flashcards...');
    await Flashcard.create([
      {
        lectureId: lecture._id,
        question: 'What is the strict prerequisite for Binary Search to work?',
        answer: 'The input array data must be in sorted order (ascending or descending).'
      },
      {
        lectureId: lecture._id,
        question: 'What is the time complexity of Binary Search in the worst case?',
        answer: 'O(log N) - Logarithmic time complexity.'
      },
      {
        lectureId: lecture._id,
        question: 'How does Binary Search divide the search space?',
        answer: 'By checking the middle element and discarding the half that cannot contain the target.'
      },
      {
        lectureId: lecture._id,
        question: 'What is the space complexity of iterative Binary Search?',
        answer: 'O(1) - Constant auxiliary space since it only uses a few pointer variables.'
      }
    ]);

    // 6. Create Sample MCQs
    // console.log('Creating MCQs...');
    await MCQ.create([
      {
        lectureId: lecture._id,
        question: 'Which of the following is the time complexity of Binary Search?',
        options: [
          'A) O(1)',
          'B) O(N)',
          'C) O(N^2)',
          'D) O(log N)'
        ],
        correctAnswer: 'D',
        explanation: 'Binary Search halves the search space at each step, meaning the number of steps grows logarithmically as the size of the array increases, yielding O(log N) time.'
      },
      {
        lectureId: lecture._id,
        question: 'What happens if you run Binary Search on an unsorted array?',
        options: [
          'A) It runs in O(N) time',
          'B) It will return incorrect results or fail to find the target',
          'C) It automatically sorts the array first',
          'D) It throws a runtime syntax exception'
        ],
        correctAnswer: 'B',
        explanation: 'Binary Search relies on the sorted order to discard halves. If the array is unsorted, the decision of which half to discard is unpredictable, leading to wrong results.'
      },
      {
        lectureId: lecture._id,
        question: 'Which index calculation prevents integer overflow in large arrays?',
        options: [
          'A) mid = (low + high) / 2',
          'B) mid = low + (high - low) / 2',
          'C) mid = high - (low / 2)',
          'D) mid = low * (high - low) / 2'
        ],
        correctAnswer: 'B',
        explanation: 'In languages with fixed integer sizes, (low + high) can exceed the maximum integer threshold. Expressing it as low + (high - low) / 2 avoids this addition and prevents overflow.'
      }
    ]);

    // console.log('Database seeding finished successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
