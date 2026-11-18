/* SkillSphere web — constants (ported from Constants.java) */
(function () {
  'use strict';
  var SS = (window.SS = window.SS || {});
  SS.views = SS.views || {};

  SS.C = {
    CATEGORIES: ['AI/ML', 'Web Dev', 'Mobile', 'Design', 'IoT', 'Security', 'Cloud', 'Data Science'],

    // Emoji shown on a project card, chosen from its first category.
    CATEGORY_ICONS: {
      'AI/ML': '🤖',
      'Web Dev': '🌐',
      'Mobile': '📱',
      'Design': '🎨',
      'IoT': '💻',
      'Security': '🛡️',
      'Cloud': '☁️',
      'Data Science': '📊'
    },
    DEFAULT_ICON: '🤖',

    DEPARTMENTS: ['Computer Engineering', 'Management'],

    // Skill groups. `signup: true` groups are offered in the sign-up picker
    // (the Android app left databases out of sign-up but kept them in Edit Profile).
    SKILL_GROUPS: [
      { id: 'languages', label: 'Languages', signup: true,
        items: ['Python', 'JavaScript', 'Java', 'C++', 'Kotlin', 'Swift', 'Dart', 'TypeScript'] },
      { id: 'frameworks', label: 'Frameworks', signup: true,
        items: ['React Native', 'Flutter', 'Vue.js', 'Django', 'FastAPI', 'Next.js'] },
      { id: 'tools', label: 'Tools & DevOps', signup: true,
        items: ['Firebase', 'AWS', 'Docker', 'Git', 'Linux'] },
      { id: 'aiml', label: 'AI / ML', signup: true,
        items: ['TensorFlow', 'NLP', 'LangChain', 'OpenCV'] },
      { id: 'design', label: 'Design', signup: true,
        items: ['Figma', 'Adobe XD', 'UI/UX Research'] },
      { id: 'databases', label: 'Databases', signup: false,
        items: ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite'] }
    ],

    MAX_PROJECT_MEMBERS: 5,          // CreateProjectActivity used a fixed 5
    MAX_MESSAGE_LENGTH: 500,
    MAX_PROJECT_TITLE_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 300,
    MAX_IMAGE_SIZE_MB: 5,
    MIN_PASSWORD_LENGTH: 6
  };
})();
