export function buildFallbackAnswer(question) {
  return `## Answer

### 1. Definition
${question} can be understood by breaking it into meaning, working, example and use case.

### 2. Explanation
First identify the topic, then understand its purpose, internal working and where it is used.

### 3. Example
For programming or DSA, always dry run with input/output. For DBMS/OS/CN, write definition, working, diagram logic and advantages.

### 4. Interview Points
- Definition
- Working
- Example
- Complexity if applicable
- Real-world use
- Common mistakes

### 5. Exam Format
Definition → Working → Example → Diagram/Dry Run → Advantages → Conclusion.`;
}

export function detectWeakTopics(question) {
  const q = String(question || "").toLowerCase();
  const topics = [];
  const map = [
    ["recursion", "Recursion"],
    ["binary search", "Binary Search"],
    ["sort", "Sorting"],
    ["dbms", "DBMS"],
    ["join", "DBMS Joins"],
    ["os", "Operating System"],
    ["scheduling", "OS Scheduling"],
    ["array", "Arrays"],
    ["linked list", "Linked List"],
    ["stack", "Stack"],
    ["queue", "Queue"],
    ["network", "Computer Networks"],
    ["python", "Python"],
    ["javascript", "JavaScript"]
  ];
  for (const [key, topic] of map) {
    if (q.includes(key)) topics.push(topic);
  }
  return [...new Set(topics)];
}

export async function callGemini(question, userContext = "") {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!key || key.includes("your_")) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `
You are ConceptFlow AI, a professional edtech mentor.

User context:
${userContext || "No context"}

Answer rules:
- Use clear English.
- Give exam-friendly but practical answer.
- Use headings.
- Include examples.
- Include interview/viva points.
- Include common mistakes.
- If code is needed, add short code block.

Question:
${question}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed");
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
