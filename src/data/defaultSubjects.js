export const defaultSubjects = [
  {
    name: "Data Structures & Algorithms",
    category: "IT Core",
    icon: "⛓",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
    color: "green",
    conceptCount: 250,
    topics: [
      { title: "Array", description: "Linear data structure", difficulty: "easy", keywords: ["array", "index"] },
      { title: "Linked List", description: "Node based data structure", difficulty: "medium", keywords: ["node", "pointer"] },
      { title: "Stack", description: "LIFO data structure", difficulty: "easy", keywords: ["push", "pop"] },
      { title: "Queue", description: "FIFO data structure", difficulty: "easy", keywords: ["enqueue", "dequeue"] },
      { title: "Tree", description: "Hierarchical data structure", difficulty: "medium", keywords: ["binary tree", "traversal"] },
      { title: "Graph", description: "Nodes and edges", difficulty: "hard", keywords: ["bfs", "dfs"] }
    ]
  },
  { name: "Operating System", category: "IT Core", icon: "⚙", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", color: "pink", conceptCount: 180, topics: [{ title: "Process Scheduling" }, { title: "Deadlock" }, { title: "Memory Management" }] },
  { name: "Database Management System", category: "IT Core", icon: "◎", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg", color: "yellow", conceptCount: 150, topics: [{ title: "SQL" }, { title: "Normalization" }, { title: "Joins" }] },
  { name: "Computer Networks", category: "IT Core", icon: "◒", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/networkx/networkx-original.svg", color: "blue", conceptCount: 120, topics: [{ title: "OSI Model" }, { title: "TCP/IP" }, { title: "Routing" }] },
  { name: "Artificial Intelligence", category: "Trending", icon: "🧠", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", color: "purple", conceptCount: 200, isTrending: true, topics: [{ title: "Search Algorithms" }, { title: "Knowledge Representation" }] },
  { name: "Machine Learning", category: "Trending", icon: "🛡", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg", color: "pink", conceptCount: 180, isTrending: true, topics: [{ title: "Regression" }, { title: "Classification" }, { title: "Model Evaluation" }] },
  { name: "Deep Learning", category: "Trending", icon: "✣", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg", color: "green", conceptCount: 150, isTrending: true, topics: [{ title: "Neural Networks" }, { title: "CNN" }, { title: "RNN" }] },
  { name: "Cloud Computing", category: "Trending", icon: "☁", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg", color: "blue", conceptCount: 110, topics: [{ title: "IaaS" }, { title: "PaaS" }, { title: "SaaS" }] }
];
