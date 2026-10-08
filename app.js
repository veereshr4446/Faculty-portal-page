const FOOT = `
<p class="foot">
  Built with
  <span class="heart" role="img" aria-label="love">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#C6532B"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
        2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
        C13.09 3.81 14.76 3 16.5 3
        19.58 3 22 5.42 22 8.5
        c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  </span>
  by <b>Viresh R.</b> · II Year CSE-A · RYMEC · © 2026
</p>
`;


/* =========================================================
   API
   ========================================================= */

const API =
  'https://script.google.com/macros/s/AKfycbyd8YHPGlBy71wieBP0JL3NtHNPiBK09wU5W4gkPzR0OjVoh4MOOkKQs0Fw5wE0Cyfr0w/exec';


/* =========================================================
   RATING LABELS
   ========================================================= */

const M = [
  '',
  'Very Poor',
  'Poor',
  'Needs Improvement',
  'Below Average',
  'Average',
  'Satisfactory',
  'Good',
  'Very Good',
  'Excellent',
  'Outstanding'
];


/* =========================================================
   STATE
   ========================================================= */

let T = sessionStorage.getItem('tok') || '';

let D = {
  faculty: {
    name: '',
    dept: ''
  },
  feedback: [],
  requests: []
};

let view = 'dash';

let F = {
  q: '',
  sem: '',
  sub: '',
  rt: ''
};


/* =========================================================
   SHORTCUT
   ========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   API CALL
   ========================================================= */

async function call(body) {

  const response = await fetch(API, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(
      'Server error: ' + response.status
    );
  }

  const data = await response.json();

  return data;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

const esc = value =>
  String(value ?? '')
    .replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char])
    );


/* =========================================================
   AVERAGE
   ========================================================= */

const avg = array => {

  if (!Array.isArray(array) || !array.length) {
    return 0;
  }

  return array.reduce(
    (sum, item) =>
      sum + Number(item.rating || 0),
    0
  ) / array.length;

};


/* =========================================================
   DATE FORMAT
   ========================================================= */

const fmt = timestamp => {

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  );

};


/* =========================================================
   LOGIN
   ========================================================= */

async function signIn() {

  $('le').textContent = '';

  try {

    const username =
      $('u').value.trim();

    const password =
      $('p').value;


    if (!username || !password) {

      throw new Error(
        'Enter your username and password.'
      );

    }


    const result = await call({

      action: 'login',

      username: username,

      password: password

    });


    if (
      !result ||
      result.error
    ) {

      throw new Error(
        result?.error ||
        'Login failed.'
      );

    }


    if (!result.token) {

      throw new Error(
        'Login succeeded but no session was returned.'
      );

    }


    T = result.token;

    sessionStorage.setItem(
      'tok',
      T
    );


    // IMPORTANT:
    // Wait for dashboard before considering
    // the login completely successful.

    await load();


  } catch (error) {

    console.error(
      'LOGIN ERROR:',
      error
    );

    $('le').textContent =
      error.message ||
      'Unable to sign in.';

  }

}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function load() {

  try {

    if (!T) {

      throw new Error(
        'Please sign in.'
      );

    }


    const result = await call({

      action: 'dashboard',

      token: T

    });


    console.log(
      'DASHBOARD RESPONSE:',
      result
    );


    if (
      !result ||
      result.error
    ) {

      throw new Error(
        result?.error ||
        'Unable to load dashboard.'
      );

    }


    /*
      IMPORTANT SAFETY CHECK

      Prevents:
      Cannot read properties of undefined (reading 'map')
    */

    D = {

      faculty:
        result.faculty || {
          name: '',
          dept: ''
        },

      feedback:
        Array.isArray(result.feedback)
          ? result.feedback
          : [],

      requests:
        Array.isArray(result.requests)
          ? result.requests
          : []

    };


    // Only show app after dashboard
    // has successfully loaded.

    $('login')
      .classList
      .add('hide');

    $('rec')
      .classList
      .add('hide');

    $('app')
      .classList
      .remove('hide');


    render();


  } catch (error) {

    console.error(
      'DASHBOARD ERROR:',
      error
    );


    // Remove invalid session.

    T = '';

    sessionStorage.removeItem(
      'tok'
    );


    $('login')
      .classList
      .remove('hide');

    $('app')
      .classList
      .add('hide');


    $('le').textContent =
      error.message ||
      'Session expired. Please sign in again.';

  }

}


/* =========================================================
   PASSWORD RECOVERY
   ========================================================= */

function showRec(on) {

  $('login')
    .classList
    .toggle(
      'hide',
      !!on
    );

  $('rec')
    .classList
    .toggle(
      'hide',
      !on
    );

  $('rf')
    .classList
    .remove('hide');

  $('rd')
    .classList
    .add('hide');

  $('re').textContent = '';

}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

async function doReset() {

  $('re').textContent = '';


  if (
    $('rp').value !==
    $('rp2').value
  ) {

    $('re').textContent =
      'Passwords do not match.';

    return;

  }


  try {

    const result = await call({

      action: 'reset',

      username:
        $('ru').value.trim(),

      code:
        $('rc').value,

      password:
        $('rp').value

    });


    if (
      !result ||
      result.error
    ) {

      throw new Error(
        result?.error ||
        'Password reset failed.'
      );

    }


    const remaining =
      Number(result.left || 0);


    $('rm').textContent =

      remaining > 0

        ? `Password updated. You have ${remaining} recovery code${remaining > 1 ? 's' : ''} left. Keep them safe.`

        : 'Password updated. That was your last recovery code. If you forget your password again, ask the administrator for new codes.';


    $('rf')
      .classList
      .add('hide');

    $('rd')
      .classList
      .remove('hide');


    ['rc', 'rp', 'rp2']
      .forEach(
        id => $(id).value = ''
      );


  } catch (error) {

    console.error(
      'RESET ERROR:',
      error
    );

    $('re').textContent =
      error.message ||
      'Password reset failed.';

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function signOut() {

  const token =
    T;


  // Clear local session immediately.

  T = '';

  sessionStorage.removeItem(
    'tok'
  );


  try {

    if (token) {

      await call({

        action: 'logout',

        token: token

      });

    }

  } catch (error) {

    console.warn(
      'Logout API error:',
      error
    );

  }


  location.reload();

}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    'nav [data-v]'
  )
  .forEach(button => {

    button.onclick = () => {

      view =
        button.dataset.v;


      document
        .querySelectorAll(
          'nav [data-v]'
        )
        .forEach(
          item =>
            item.classList.toggle(
              'on',
              item === button
            )
        );


      render();

    };

  });


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  if (
    !D ||
    !Array.isArray(D.feedback) ||
    !Array.isArray(D.requests)
  ) {

    console.error(
      'Invalid dashboard data:',
      D
    );

    return;

  }


  let content = '';


  if (view === 'dash') {

    content = dash();

  } else if (view === 'fb') {

    content = feed();

  } else {

    content = subs();

  }


  $('main').innerHTML =
    content +
    FOOT;


  scrollTo(
    0,
    0
  );

}


/* =========================================================
   GREETING
   ========================================================= */

function greet() {

  const hour =
    new Date().getHours();


  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function dash() {

  const feedback =
    Array.isArray(D.feedback)
      ? D.feedback
      : [];


  const requests =
    Array.isArray(D.requests)
      ? D.requests
      : [];


  const now =
    new Date();


  const month =
    now.getMonth();

  const year =
    now.getFullYear();


  const monthly =
    feedback.filter(item => {

      const date =
        new Date(item.ts);

      return (
        date.getMonth() === month &&
        date.getFullYear() === year
      );

    }).length;


  const subjects =
    new Set(
      feedback.map(
        item => item.subject
      )
    ).size;


  const dist = [

    [
      10,
      feedback.filter(
        x => Number(x.rating) === 10
      ).length
    ],

    [
      9,
      feedback.filter(
        x => Number(x.rating) === 9
      ).length
    ],

    [
      8,
      feedback.filter(
        x => Number(x.rating) === 8
      ).length
    ],

    [
      7,
      feedback.filter(
        x => Number(x.rating) === 7
      ).length
    ],

    [
      6,
      feedback.filter(
        x => Number(x.rating) === 6
      ).length
    ],

    [
      5,
      feedback.filter(
        x => Number(x.rating) === 5
      ).length
    ]

  ];


  dist.push([

    '1–4',

    feedback.filter(
      x => Number(x.rating) <= 4
    ).length

  ]);


  const max =
    Math.max(
      1,
      ...dist.map(
        item => item[1]
      )
    );


  const requestCounts = {};


  requests.forEach(request => {

    const category =
      request.cat ||
      'Other';


    requestCounts[category] =
      (
        requestCounts[category] ||
        0
      ) + 1;

  });


  const requestList =

    Object.entries(
      requestCounts
    )

      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  const requestMax =
    requestList.length
      ? requestList[0][1]
      : 1;


  return `

<h2>
  ${greet()},
  ${esc(D.faculty.name)}
</h2>

<p class="sm">
  ${esc(D.faculty.dept)}
</p>


<div class="stats">

  <div class="card stat">
    <b>${avg(feedback).toFixed(1)}</b>
    Average rating
  </div>

  <div class="card stat">
    <b>${feedback.length}</b>
    Responses
  </div>

  <div class="card stat">
    <b>${subjects}</b>
    Subjects
  </div>

  <div class="card stat">
    <b>${monthly}</b>
    This month
  </div>

</div>


<div class="cols">


  <div class="card">

    <h3>
      Rating distribution
    </h3>

    ${dist.map(item => `

      <div class="bar">

        <span>
          ${item[0]}
          ${Number(item[0]) > 4 ? ' ★' : ''}
        </span>

        <i
          style="width:${item[1] / max * 100}%"
        ></i>

        <span>
          ${item[1]}
        </span>

      </div>

    `).join('')}

  </div>


  <div class="card">

    <h3>
      Rating trend
    </h3>

    ${trend(feedback)}

  </div>


</div>


<div class="card">

  <h3>
    What students want
  </h3>


  ${
    requestList.length

      ? requestList
          .map(item => `

            <div class="bar w g">

              <span>
                ${esc(item[0])}
              </span>

              <i
                style="width:${item[1] / requestMax * 100}%"
              ></i>

              <span>
                ${item[1]}
              </span>

            </div>

          `)
          .join('')

      : `

        <p class="sm">
          No recurring requests yet.
          They appear as students write feedback.
        </p>

      `
  }


  ${
    requestList.length

      ? `

        <p class="sm">
          Open Feedback and search a keyword
          to read the comments behind each request.
        </p>

      `

      : ''
  }

</div>

`;

}


/* =========================================================
   RATING TREND
   ========================================================= */

function trend(feedback) {

  if (
    !Array.isArray(feedback) ||
    !feedback.length
  ) {

    return `
      <p class="sm">
        The trend appears after feedback arrives
        in two different months.
      </p>
    `;

  }


  const groups = {};


  feedback.forEach(item => {

    const date =
      new Date(item.ts);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return;
    }


    const key =
      date.getFullYear() * 12 +
      date.getMonth();


    if (!groups[key]) {
      groups[key] = [];
    }


    groups[key].push(item);

  });


  const keys =
    Object.keys(groups)
      .sort(
        (a, b) =>
          Number(a) - Number(b)
      );


  if (keys.length < 2) {

    return `
      <p class="sm">
        The trend appears after feedback arrives
        in two different months.
      </p>
    `;

  }


  const points =

    keys.map(
      (key, index) => {

        const rating =
          avg(groups[key]);


        return [

          40 +
          index *
          (
            300 /
            (keys.length - 1)
          ),

          10 +
          (10 - rating) *
          14,

          rating,

          new Date(
            Math.floor(
              Number(key) / 12
            ),
            Number(key) % 12
          )
            .toLocaleString(
              'en',
              {
                month: 'short'
              }
            )

        ];

      }
    );


  return `

<svg viewBox="0 0 360 180">

  <g
    stroke="#DED6CC"
    font-size="10"
    fill="#756E68"
  >

    ${
      [10, 8, 6, 4]
        .map(value => `

          <line
            x1="30"
            x2="350"
            y1="${10 + (10 - value) * 14}"
            y2="${10 + (10 - value) * 14}"
          />

          <text
            x="4"
            y="${14 + (10 - value) * 14}"
            stroke="none"
          >
            ${value}
          </text>

        `)
        .join('')
    }

  </g>


  <polyline
    fill="none"
    stroke="#C6532B"
    stroke-width="2.5"
    points="
      ${points
        .map(
          point =>
            point[0] +
            ',' +
            point[1]
        )
        .join(' ')
      }
    "
  />


  ${
    points
      .map(point => `

        <circle
          cx="${point[0]}"
          cy="${point[1]}"
          r="4"
          fill="#C6532B"
        />

        <text
          x="${point[0]}"
          y="172"
          font-size="10"
          text-anchor="middle"
          fill="#756E68"
        >
          ${point[3]}
        </text>

      `)
      .join('')
  }

</svg>

`;

}


/* =========================================================
   FILTER FEEDBACK
   ========================================================= */

function filtered() {

  const feedback =
    Array.isArray(D.feedback)
      ? D.feedback
      : [];


  return feedback

    .filter(item => {

      const query =
        F.q.toLowerCase();


      const searchable = (

        String(item.comment || '') +
        ' ' +
        String(item.subject || '') +
        ' ' +
        String(item.name || '')

      ).toLowerCase();


      const matchesQuery =
        !query ||
        searchable.includes(query);


      const matchesSemester =
        !F.sem ||
        String(item.sem) ===
        String(F.sem);


      const matchesSubject =
        !F.sub ||
        item.subject === F.sub;


      let matchesRating = true;


      if (F.rt) {

        const [
          low,
          high
        ] =
          F.rt
            .split('-')
            .map(Number);


        matchesRating =
          Number(item.rating) >= low &&
          Number(item.rating) <= high;

      }


      return (
        matchesQuery &&
        matchesSemester &&
        matchesSubject &&
        matchesRating
      );

    })

    .sort(
      (a, b) =>
        new Date(b.ts) -
        new Date(a.ts)
    );

}


/* =========================================================
   FEEDBACK PAGE
   ========================================================= */

function feed() {

  const feedback =
    Array.isArray(D.feedback)
      ? D.feedback
      : [];


  const subjects = [

    ...new Set(
      feedback.map(
        item => item.subject
      )
    )

  ];


  return `

<h2>
  Feedback
</h2>


<div class="filters">

  <input
    id="fq"
    placeholder="Search comments"
    value="${esc(F.q)}"
  >


  <select id="fs">

    <option value="">
      All semesters
    </option>

    ${
      [1,2,3,4,5,6,7,8]
        .map(
          number => `

            <option
              value="${number}"
              ${F.sem == number ? 'selected' : ''}
            >
              ${number}
            </option>

          `
        )
        .join('')
    }

  </select>


  <select id="fj">

    <option value="">
      All subjects
    </option>

    ${
      subjects
        .map(
          subject => `

            <option
              value="${esc(subject)}"
              ${F.sub === subject ? 'selected' : ''}
            >
              ${esc(subject)}
            </option>

          `
        )
        .join('')
    }

  </select>


  <select id="fr">

    <option value="">
      All ratings
    </option>

    ${
      ['1-4', '5-6', '7-8', '9-10']
        .map(
          rating => `

            <option
              value="${rating}"
              ${F.rt === rating ? 'selected' : ''}
            >
              ${rating}
            </option>

          `
        )
        .join('')
    }

  </select>

</div>


<div id="fl">
  ${items()}
</div>

`;

}


/* =========================================================
   FEEDBACK ITEMS
   ========================================================= */

function items() {

  const list =
    filtered();


  if (!list.length) {

    return `

      <p class="sm">
        No feedback matches.
        Clear a filter to see more.
      </p>

    `;

  }


  return list

    .map(item => `

      <div
        class="card fb"
        onclick="detail('${esc(item.id)}')"
      >

        <b>
          ${Number(item.rating)} / 10
        </b>

        <span class="sm">
          ${esc(
            M[Number(item.rating)] || ''
          )}
        </span>


        <p>
          “${esc(item.comment)}”
        </p>


        <span class="sm">

          Sem ${esc(item.sem)}
          · ${esc(item.branch)}
          · ${esc(item.subject)}
          · ${fmt(item.ts)}

        </span>

      </div>

    `)

    .join('');

}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

document.addEventListener(
  'input',
  event => {

    const map = {

      fq: 'q',
      fs: 'sem',
      fj: 'sub',
      fr: 'rt'

    };


    const field =
      map[event.target.id];


    if (!field) {
      return;
    }


    F[field] =
      event.target.value;


    const list =
      $('fl');


    if (list) {

      list.innerHTML =
        items();

    }

  }
);


/* =========================================================
   FEEDBACK DETAIL
   ========================================================= */

function detail(id) {

  const item =
    D.feedback.find(
      feedback =>
        feedback.id === id
    );


  if (!item) {
    return;
  }


  $('mc').innerHTML = `

    <h3>
      Feedback ${esc(item.id)}
    </h3>


    <dl>

      <dt>
        Student
      </dt>

      <dd>
        ${esc(item.name)}
      </dd>


      <dt>
        USN / Roll
      </dt>

      <dd>
        ${esc(item.usn || 'Hidden')}
      </dd>


      <dt>
        Semester
      </dt>

      <dd>
        ${esc(item.sem)}
      </dd>


      <dt>
        Branch
      </dt>

      <dd>
        ${esc(item.branch)}
      </dd>


      <dt>
        Subject
      </dt>

      <dd>
        ${esc(item.subject)}
      </dd>


      <dt>
        Rating
      </dt>

      <dd>
        ${Number(item.rating)} / 10
        ·
        ${esc(
          M[Number(item.rating)] || ''
        )}
      </dd>


      <dt>
        Submitted
      </dt>

      <dd>
        ${fmt(item.ts)}
      </dd>

    </dl>


    <p>
      “${esc(item.comment)}”
    </p>


    <button
      class="btn"
      onclick="$('modal').classList.add('hide')"
    >
      Close
    </button>

  `;


  $('modal')
    .classList
    .remove('hide');

}


/* =========================================================
   SUBJECTS
   ========================================================= */

function subs() {

  const groups = {};


  const feedback =
    Array.isArray(D.feedback)
      ? D.feedback
      : [];


  feedback.forEach(item => {

    const subject =
      item.subject || 'Unknown Subject';


    if (!groups[subject]) {
      groups[subject] = [];
    }


    groups[subject].push(item);

  });


  const cards =
    Object.entries(groups);


  if (!cards.length) {

    return `

      <h2>
        My subjects
      </h2>

      <p class="sm">
        No feedback yet.
      </p>

    `;

  }


  return `

    <h2>
      My subjects
    </h2>


    <div class="stats">

      ${
        cards
          .map(
            ([subject, feedback]) => `

              <div
                class="card fb"
                onclick="openSubject(${JSON.stringify(subject)})"
              >

                <h3>
                  ${esc(subject)}
                </h3>

                <b>
                  ${avg(feedback).toFixed(1)}
                </b>

                <div class="sm">
                  ${feedback.length}
                  responses
                </div>

              </div>

            `
          )
          .join('')
      }

    </div>

  `;

}


/* =========================================================
   OPEN SUBJECT
   ========================================================= */

function openSubject(subject) {

  F = {

    q: '',

    sem: '',

    sub: subject,

    rt: ''

  };


  view = 'fb';


  document
    .querySelectorAll(
      'nav [data-v]'
    )
    .forEach(
      button =>
        button.classList.toggle(
          'on',
          button.dataset.v === 'fb'
        )
    );


  render();

}


/* =========================================================
   START / RESTORE SESSION
   ========================================================= */

if (T) {

  load();

}
