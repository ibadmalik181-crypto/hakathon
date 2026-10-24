let employees = JSON.parse(
    localStorage.getItem("employees") || "[]"
);

let attendance = JSON.parse(
    localStorage.getItem("attendance") || "[]"
);

let leaves = JSON.parse(
    localStorage.getItem("leaves") || "[]"
);

function saveData() {
    localStorage.setItem(
        "employees",
        JSON.stringify(employees)
    );

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );

    localStorage.setItem(
        "leaves",
        JSON.stringify(leaves)
    );
}

function showPage(page) {
    const app = document.getElementById("app");

    if (page === "dashboard") {
        app.innerHTML = `
            <h1>Admin Dashboard</h1>
            <p class="subtitle">
                Welcome to HCM Lite HR System
            </p>

            <div class="cards">
                <div class="card">
                    Total Employees
                    <h2>${employees.length}</h2>
                </div>

                <div class="card">
                    Attendance Records
                    <h2>${attendance.length}</h2>
                </div>

                <div class="card">
                    Leave Requests
                    <h2>${leaves.length}</h2>
                </div>
            </div>

            <div class="panel">
                <h3>Welcome to HCM Lite</h3>
                <p>Manage your employees and company records.</p>
            </div>
        `;
    }

    if (page === "employees") {
        app.innerHTML = `
            <h1>Manage Employees</h1>
            <p class="subtitle">Add your employees below.</p>

            <div class="panel">
                <form id="employeeForm">
                    <label>Employee Name</label>
                    <input id="empName" required>

                    <label>Department</label>
                    <input id="empDept" required>

                    <label>Monthly Salary</label>
                    <input id="empSalary"
                        type="number" min="0" required>

                    <button type="submit">Add Employee</button>
                </form>
            </div>

            <div class="panel">
                <h3>Employee List</h3>

                <div class="table-wrap">
                    <table>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Salary</th>
                            <th>Action</th>
                        </tr>

                        ${employees.map((e, i) => `
                            <tr>
                                <td>${e.name}</td>
                                <td>${e.department}</td>
                                <td>Rs. ${e.salary}</td>
                                <td>
                                    <button
                                        onclick="deleteEmployee(${i})">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </table>
                </div>
            </div>
        `;

        document.getElementById("employeeForm")
            .addEventListener("submit", function(event) {
                event.preventDefault();

                employees.push({
                    name: document.getElementById("empName").value,
                    department: document.getElementById("empDept").value,
                    salary: Number(
                        document.getElementById("empSalary").value
                    )
                });

                saveData();
                showPage("employees");
            });
    }

    if (page === "attendance") {
        app.innerHTML = `
            <h1>Attendance</h1>
            <p class="subtitle">Employee check-in system</p>

            <div class="panel">
                <label>Select Employee</label>

                <select id="attendanceEmployee">
                    ${employees.map((e, i) => `
                        <option value="${i}">${e.name}</option>
                    `).join("")}
                </select>

                <button onclick="checkIn()">Check In</button>

                <div class="table-wrap">
                    <table>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Time</th>
                        </tr>

                        ${attendance.map(a => `
                            <tr>
                                <td>${a.name}</td>
                                <td>${a.date}</td>
                                <td>${a.time}</td>
                            </tr>
                        `).join("")}
                    </table>
                </div>
            </div>
        `;
    }

    if (page === "leaves") {
        app.innerHTML = `
            <h1>Leave Requests</h1>
            <p class="subtitle">Apply for leave and approve requests.</p>

            <div class="panel">
                <label>Employee</label>

                <select id="leaveEmployee">
                    ${employees.map((e, i) => `
                        <option value="${i}">${e.name}</option>
                    `).join("")}
                </select>

                <label>Leave Date</label>
                <input type="date" id="leaveDate">

                <button onclick="applyLeave()">
                    Apply for Leave
                </button>
            </div>

            <div class="panel">
                <h3>Leave Applications</h3>

                ${leaves.map((l, i) => `
                    <p style="margin:12px 0">
                        ${l.name} — ${l.date} — ${l.status}

                        ${l.status === "Pending" ? `
                            <button onclick="approveLeave(${i})">
                                Approve
                            </button>
                        ` : ""}
                    </p>
                `).join("")}
            </div>
        `;
    }

    if (page === "payslip") {
        app.innerHTML = `
            <h1>Monthly Payslip</h1>
            <p class="subtitle">Employee salary details</p>

            <div class="panel">
                <div class="table-wrap">
                    <table>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Salary</th>
                        </tr>

                        ${employees.map(e => `
                            <tr>
                                <td>${e.name}</td>
                                <td>${e.department}</td>
                                <td>Rs. ${e.salary}</td>
                            </tr>
                        `).join("")}
                    </table>
                </div>

                <br>
                <button onclick="window.print()">
                    Print / Save PDF
                </button>
            </div>
        `;
    }
}

function deleteEmployee(index) {
    employees.splice(index, 1);
    saveData();
    showPage("employees");
}

function checkIn() {
    if (employees.length === 0) {
        alert("Please add an employee first.");
        return;
    }

    const index = Number(
        document.getElementById("attendanceEmployee").value
    );

    attendance.push({
        name: employees[index].name,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    });

    saveData();
    showPage("attendance");
}

function applyLeave() {
    if (employees.length === 0) {
        alert("Please add an employee first.");
        return;
    }

    const index = Number(
        document.getElementById("leaveEmployee").value
    );

    const date = document.getElementById("leaveDate").value;

    if (!date) {
        alert("Please select a leave date.");
        return;
    }

    leaves.push({
        name: employees[index].name,
        date: date,
        status: "Pending"
    });

    saveData();
    showPage("leaves");
}

function approveLeave(index) {
    leaves[index].status = "Approved";
    saveData();
    showPage("leaves");
}

showPage("dashboard");