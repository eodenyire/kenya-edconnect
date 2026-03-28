# DigiStudentPro v2

![DigiStudentPro Banner](./assets/banner.png)

**Empowering Every Kenyan Learner to Excel**

DigiStudentPro is Kenya's premier **Competency-Based Curriculum (CBC) digital platform**, offering AI-powered career guidance, comprehensive learning resources, mentorship, and community engagement — from Pre-Primary to University.  

---

## **Table of Contents**
- [About](#about)
- [Features](#features)
- [Modules](#modules)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## **About**

DigiStudentPro v2 provides an integrated learning ecosystem for Kenyan students, teachers, and mentors. It aligns with **Kenya’s CBC framework** and KUCCPS university placement clusters. The platform focuses on:

- **AI Career Guidance:** Dream Career Simulator and predictive analytics
- **CBC-aligned Learning:** Text, video, audio, PDFs, and interactive assessments
- **Mentorship & Squads:** Real-time chat with verified mentors
- **Community & Blogs:** Study hacks, scholarship updates, and CBC news
- **Offline Support:** Progressive Web App (PWA) ready for low-connectivity areas
- **Child Safety & Compliance:** DPA 2019 compliance, verified mentors, audit logs

---

## **Features**

- **DigiGuide:** AI-powered career recommendations & Dream Career Simulator  
- **DigiLab:** Learning resources, past papers, quizzes, and interactive lessons  
- **DigiChat:** Study squads, verified mentor messaging, and Q&A forums  
- **DigiBlog:** Community posts, study hacks, and educational content  
- **Student Dashboard:** Track career matches, resources viewed, and achievements  
- **CBC Coverage:** Pre-Primary → University  
- **Data Compliance:** Fully DPA 2019 compliant with parental consent  

---

## **Modules**

| Module      | Description                                                                 |
|------------|-----------------------------------------------------------------------------|
| **DigiGuide** | Explore KUCCPS clusters, AI career mapping, Dream Simulator               |
| **DigiLab**   | Access CBC-aligned content, videos, audio, PDFs, and interactive quizzes |
| **DigiChat**  | Connect with mentors, join study squads, and engage in forums             |
| **DigiBlog**  | Read and post educational content, study hacks, and scholarship updates   |

---

## **Technologies**

- **Frontend:** React, TypeScript, TailwindCSS, Framer Motion  
- **Backend / Database:** Supabase (PostgreSQL, Realtime, Auth)  
- **State Management:** React Query / Zustand  
- **Testing:** Vitest, Playwright  
- **PWA:** Offline-first support  
- **CI/CD:** GitHub Actions  

---

## **Getting Started**

### **Prerequisites**

- Node.js v20+ / Bun v1.0+  
- npm or yarn  
- Supabase account  

---

### **Setup & Installation**

1. **Clone the repository:**

```bash
git clone https://github.com/eodenyire/digistudentprov2.git
cd digistudentprov2
````

2. **Install dependencies:**

```bash
npm install
# or
bun install
```

3. **Run the development server:**

```bash
npm run dev
# or
bun dev
```

The app should now be available at `http://localhost:5173`.

---

### **Environment Variables**

Create a `.env` file at the root of the project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ensure you replace these with your Supabase project credentials.

---

## **Usage**

* **Dashboard:** Track your learning progress and achievements
* **DigiGuide:** Explore careers and simulate your dream path
* **DigiLab:** Access CBC-aligned resources for your grade level
* **DigiChat:** Join squads and interact with mentors
* **DigiBlog:** Read or post educational content

---

## **Contributing**

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the existing **code style and folder structure** for consistency.

---

## **License**

This project is licensed under the **MIT License**.

---
**© 2026 DigiStudentPro. Built with ❤️ for Kenyan learners.**

```

