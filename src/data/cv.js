// Single source of truth for CV content. Used by src/pages/cv.astro and
// scripts/generate-cv-pdf.mjs. Plain ESM so both Astro and Node can import it.

export const CV_PDF_PATH = "/Rok_Ajdnik_CV.pdf";

/**
 * @typedef {{ title: string, company?: string, start: string, end: string, description?: string, achievementsLabel?: string, achievements?: string[], technologies?: string[] }} Experience
 */

const plumeTechnologies = [
  "TypeScript",
  "NestJS",
  "Node.js",
  "MongoDB",
  "Kafka",
  "Grafana",
  "Kubernetes",
  "AWS",
  "CI/CD",
  "Microservices",
];

export const cv = {
  name: "Rok Ajdnik",
  headline: "Director of Software Engineering",
  location: "Celje, Slovenia",
  // Shown in the PDF header only, never on the website.
  pdfEmail: "r.ajdnik@gmail.com",
  linkedin: "https://linkedin.com/in/rokajdnik",
  website: "https://rokajdnik.com",
  github: "https://github.com/ajdnik",
  summary:
    "Director of Software Engineering with over 15 years of experience building scalable software and leading engineering teams. At Plume Design, leads 7 direct reports and a 9-member API team. Architected zero-downtime cloud migrations of over 10 million customers and consolidated 1,500 APIs into fewer than 400. Three-time startup CTO and co-founder who helped secure over $3 million in funding. Co-inventor on four patent applications, with experience in distributed systems, API design and computer vision.",

  /** @type {Experience[]} */
  experience: [
    {
      title: "Director of Software Engineering",
      company: "Plume Design, Inc.",
      start: "Sep 2025",
      end: "Present",
      description:
        "Leading engineering teams at a telecommunications company focused on smart home and WiFi solutions, with 7 direct reports and a 9-member API team.",
      achievementsLabel: "Across all roles at Plume (Sep 2020 - Present):",
      achievements: [
        "Architected, led and executed large-scale live customer migrations between production clouds with zero downtime, moving over 10 million customers.",
        "Modernized Plume's APIs, reducing 1,500 APIs to fewer than 400 and making interfaces more concise across engineering teams.",
        "Standardized authentication/authorization, deprecation policy and API design guidelines.",
        "Built a documentation portal used by 500 ISPs worldwide.",
      ],
      technologies: plumeTechnologies,
    },
    {
      title: "Staff Software Engineer",
      company: "Plume Design, Inc.",
      start: "Jan 2023",
      end: "Sep 2025",
      technologies: plumeTechnologies,
    },
    {
      title: "Senior Software Engineer",
      company: "Plume Design, Inc.",
      start: "Sep 2020",
      end: "Jan 2023",
      technologies: plumeTechnologies,
    },
    {
      title: "CTO & Co-Founder",
      company: "CoilPay Technologies Inc.",
      start: "Jun 2019",
      end: "Oct 2020",
      description:
        "Bank-issued smart wearable-enabled payment ecosystem for micropayments. Built an Android-like ecosystem of MicroApps for Coil wearables including smartwatch functionality.",
      achievements: [
        "Developed hardware prototypes.",
        "Participated in Startupbootcamp, a month-long startup accelerator program in Dubai (2020).",
      ],
      technologies: ["Embedded C"],
    },
    {
      title: "CTO & Co-Founder",
      company: "MikMik",
      start: "Aug 2018",
      end: "Sep 2020",
      description:
        "Integrated electric scooter micro-rental system focused on green mobility and innovation. Operated in Ljubljana, Piran, and Koper with expansion plans across Europe.",
      achievements: [
        "Deployed 1,500 scooters across multiple cities in Slovenia.",
        "Built a fleet management backend system for tracking and managing scooters.",
        "Developed hardware prototypes for a scooter locking mechanism.",
      ],
      technologies: [
        "TypeScript",
        "Node.js",
        "Kafka",
        "GCP",
        "Terraform",
        "DevOps",
        "Microservices",
      ],
    },
    {
      title: "CTO & Co-Founder",
      company: "Reveel Technologies, Inc.",
      start: "Nov 2013",
      end: "Nov 2019",
      description:
        "First company to help brands and media outlets increase revenue by adding interactive experiences to visual media. Based in San Francisco, CA.",
      achievements: [
        "Led a team of 6 engineers.",
        "Helped secure over $3 million in funding from Silicon Valley venture capital firms.",
        "Participated in the Tech Wildcatters 3-month startup accelerator in Dallas, Texas (2014).",
        "Designed and developed the content-based image retrieval (CBIR) system the company used to identify visual content in images and videos.",
        "Scaled the system to low-latency operation across a large database of visual content, from 20 thousand to 20 million images.",
      ],
      technologies: ["C++", "OpenCV", "MongoDB", "gRPC", "GCP"],
    },
    {
      title: "Computer Programmer",
      company: "Studio Kreativis d.o.o.",
      start: "Nov 2011",
      end: "Aug 2015",
      achievements: [
        "Built a desktop CAD application for designing fair booth layouts and installations.",
        "Developed miscellaneous WordPress plugins.",
        "Built and maintained WordPress websites.",
      ],
      technologies: ["PHP", "C#", "Visual Studio", "JavaScript", "HTML", "CSS"],
    },
    {
      title: "Computer Programmer",
      company: "3zsistemi",
      start: "Dec 2009",
      end: "Feb 2011",
      achievements: ["Co-developed an AJAX-based CMS framework."],
      technologies: ["JavaScript", "PHP"],
    },
  ],

  skills: [
    {
      group: "Leadership",
      items: [
        "Engineering Management",
        "Cross-functional Leadership",
        "Hiring",
        "Team Management",
        "Technical Strategy",
        "Mentoring",
        "Agile",
        "Scrum",
      ],
    },
    {
      group: "Engineering",
      items: [
        "Go",
        "TypeScript",
        "JavaScript",
        "Node.js",
        "C++",
        "Embedded C",
        "Rust",
        "C#",
        "PHP",
        "HTML",
        "CSS",
        "NestJS",
        "WordPress",
        "gRPC",
        "OAuth / OpenID Connect",
        "MongoDB",
        "Postgres",
        "Kafka",
        "Amazon Web Services (AWS)",
        "Google Cloud Platform (GCP)",
        "Kubernetes",
        "Docker",
        "Terraform",
        "Grafana",
        "DevOps",
        "CI/CD",
        "Microservices",
        "Cloud Migration",
        "Zero-Downtime Deployments",
        "Authentication and Authorization",
        "Developer Documentation",
        "OpenCV",
        "Git",
        "Visual Studio",
      ],
    },
    {
      group: "Domain Expertise",
      items: [
        "Telecommunications",
        "Computer Vision",
        "Content-Based Image Retrieval",
        "Perceptual Hashing",
        "Distributed Systems",
        "API Design",
        "Startups",
      ],
    },
    {
      group: "Spoken Languages",
      items: ["Slovenian (Native)", "English (Professional)"],
    },
  ],

  education: [
    {
      degree: "Bachelor's Degree in Computer Science",
      school: "University of Maribor",
      field: "Computer Science and Information Technologies",
      start: "2009",
      end: "2012",
    },
  ],

  certifications: [
    "Certified ScrumMaster (CSM) - Scrum Alliance, 2022",
    "Managing Multiple Generations - LinkedIn Learning, 2023",
  ],

  patents: [
    {
      title:
        "DNS Response Delay Scaled by Per-Fingerprint Request Frequency for Blocked and Paused Domains",
      number: "US Application 19/728,395",
      status: "Pending, unpublished",
      year: "2026",
      filed: "Jul 2, 2026",
      assignee: "Plume Design Inc",
      coInventors: ["Miha Klokočovnik", "Rik Williams"],
    },
    {
      title:
        "Dynamic DNS Response Shaping via Client Behavioral Fingerprinting for Blocked and Paused Domains",
      number: "US Application 19/728,461",
      status: "Pending, unpublished",
      year: "2026",
      filed: "Jul 2, 2026",
      assignee: "Plume Design Inc",
      coInventors: ["Miha Klokočovnik", "Rik Williams"],
    },
    {
      title: "System and method for cloud-based AI application management",
      number: "US 2026/0099312 A1",
      status: "Published application",
      year: "2026",
      filed: "Oct 2024",
      assignee: "Plume Design Inc",
      coInventors: [
        "Miha Klokočovnik",
        "Gabrijel Jurković",
        "Žiga Keržan",
        "Jaka Maver",
        "Mario Balukčić",
      ],
      url: "https://patents.google.com/patent/US20260099312A1/en",
    },
    {
      title:
        "Systems and methods for identifying and acquiring information regarding remotely displayed video content",
      number: "US 2016/0105731 A1",
      status: "Published application",
      year: "2016",
      filed: "May 2015",
      assignee: "Reveel Technologies Inc",
      coInventors: ["Matija Verbovšek"],
      url: "https://patents.google.com/patent/US20160105731A1/en",
    },
  ],

  talks: [
    {
      title: "Building a CBIR system and scaling it from 20 thousand to 20 million images",
      event: "ROSUS 2018: Computer image processing and its application in Slovenia",
      date: "Mar 6, 2018",
      url: "/from-20-thousand-to-20-million",
    },
  ],

  openSource: [
    {
      name: "imghash",
      description:
        "Pure Go library implementing a range of perceptual image hashing algorithms.",
      url: "https://github.com/ajdnik/imghash",
    },
    {
      name: "gozork",
      description: "Zork I ported from the original ZIL source to Go.",
      url: "https://github.com/ajdnik/gozork",
    },
  ],
};
