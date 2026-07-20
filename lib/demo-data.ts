import type { Course, CourseCategory, Period } from "@/lib/types";

export const categories: CourseCategory[] = [
  "資訊",
  "人文藝術",
  "商管",
  "自然科學",
  "語言",
  "社會科學"
];

export const dayLabels = ["一", "二", "三", "四", "五"];

export const periods: Period[] = [
  { label: "第1節", time: "08:10-09:00" },
  { label: "第2節", time: "09:10-10:00" },
  { label: "第3節", time: "10:10-11:00" },
  { label: "第4節", time: "13:10-14:00" },
  { label: "第5節", time: "14:10-15:00" }
];

const namesPool = [
  "陳品妤",
  "林彥廷",
  "張宜蓁",
  "黃冠傑",
  "吳佳穎",
  "蔡宗翰",
  "李欣妍",
  "許家瑋",
  "謝雨柔",
  "鄭博文"
];

const buildStudents = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({
    name: namesPool[index % namesPool.length],
    id: `${prefix}${String(100 + index)}`
  }));

export function seedCourses(now: number): Course[] {
  return [
    {
      id: "c1",
      title: "資料結構與演算法",
      teacher: "張明德",
      category: "資訊",
      day: 1,
      periodIndex: 0,
      location: "資訊館 201",
      description: "介紹陣列、鏈結串列、樹與圖等核心資料結構，並實作經典演算法。",
      syllabus: ["第1週：複雜度分析", "第2週：鏈結串列與堆疊", "第3週：樹狀結構", "第4週：圖論與最短路徑"],
      capacity: 30,
      enrolled: 22,
      openAt: now - 999999,
      hot: true,
      enrolledStudents: buildStudents(22, "S10"),
      waitlist: []
    },
    {
      id: "c2",
      title: "西洋藝術史導論",
      teacher: "林淑芬",
      category: "人文藝術",
      day: 2,
      periodIndex: 1,
      location: "人文大樓 105",
      description: "從文藝復興到當代藝術，建立西方視覺藝術的觀看方式。",
      syllabus: ["第1週：文藝復興", "第2週：巴洛克與洛可可", "第3週：印象派", "第4週：現代藝術"],
      capacity: 40,
      enrolled: 40,
      openAt: now - 999999,
      hot: false,
      enrolledStudents: buildStudents(40, "S20"),
      waitlist: [
        { name: "吳承翰", position: 1 },
        { name: "林小美", position: 2 },
        { name: "王大衛", position: 3 }
      ]
    },
    {
      id: "c3",
      title: "創業與新事業開發",
      teacher: "王建宏",
      category: "商管",
      day: 3,
      periodIndex: 2,
      location: "管理學院 302",
      description: "從商業模式設計到募資簡報，帶你走過一次完整的創業歷程。",
      syllabus: ["第1週：商業模式圖", "第2週：市場驗證", "第3週：財務規劃", "第4週：募資簡報"],
      capacity: 25,
      enrolled: 10,
      openAt: now + 25000,
      hot: false,
      enrolledStudents: buildStudents(10, "S30"),
      waitlist: []
    },
    {
      id: "c4",
      title: "普通物理學(一)",
      teacher: "陳雅婷",
      category: "自然科學",
      day: 1,
      periodIndex: 3,
      location: "理學院 B1",
      description: "力學與熱學基礎，含每週實驗課，建立扎實的物理直覺。",
      syllabus: ["第1週：運動學", "第2週：牛頓運動定律", "第3週：功與能量", "第4週：熱力學基礎"],
      capacity: 35,
      enrolled: 5,
      openAt: now + 3 * 24 * 3600 * 1000,
      hot: false,
      enrolledStudents: buildStudents(5, "S40"),
      waitlist: []
    },
    {
      id: "c5",
      title: "英語簡報溝通技巧",
      teacher: "李佳恩",
      category: "語言",
      day: 4,
      periodIndex: 0,
      location: "語言中心 3F",
      description: "訓練英語口語架構與台風，適合準備國際發表的同學。",
      syllabus: ["第1週：架構與開場", "第2週：視覺輔助設計", "第3週：問答應對", "第4週：模擬發表"],
      capacity: 20,
      enrolled: 12,
      openAt: now - 500000,
      hot: false,
      enrolledStudents: buildStudents(12, "S50"),
      waitlist: []
    },
    {
      id: "c6",
      title: "行為經濟學",
      teacher: "吳承翰",
      category: "社會科學",
      day: 2,
      periodIndex: 3,
      location: "社科院 210",
      description: "探討人類決策中的非理性因素，結合實驗與案例討論。",
      syllabus: ["第1週：捷思與偏誤", "第2週：展望理論", "第3週：社會偏好", "第4週：推力與政策設計"],
      capacity: 28,
      enrolled: 28,
      openAt: now - 800000,
      hot: false,
      enrolledStudents: buildStudents(28, "S60"),
      waitlist: [{ name: "周芷若", position: 1 }]
    },
    {
      id: "c7",
      title: "數位攝影入門",
      teacher: "周文彥",
      category: "人文藝術",
      day: 5,
      periodIndex: 1,
      location: "藝術中心 暗房",
      description: "從構圖、光線到後製，帶你掌握數位攝影的基本語言。",
      syllabus: ["第1週：曝光三要素", "第2週：構圖法則", "第3週：人像攝影", "第4週：後製工作流"],
      capacity: 18,
      enrolled: 3,
      openAt: now - 100000,
      hot: false,
      enrolledStudents: buildStudents(3, "S70"),
      waitlist: []
    }
  ];
}