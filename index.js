const mysql = require("mysql");
const inquirer = require ("inquirer");
const util = require ("util"); 
const conTable = require("console.table");
const { rootCertificates } = require("tls");
const { start } = require("repl");
const { allowedNodeEnvironmentFlags } = require("process");
const { default: ListPrompt } = require("inquirer/lib/prompts/list");
const { async } = require("rxjs");

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3000,
    user: 'root',
    password: 'password',
    database: 'emploee_trackerDB',
});

connection.connect((err) => {
    if (err) throw err;
    start()
});
const query = util.promisify(connection.query).bind(connection);
const start = () => {
    inquirer.prompt({
        name: 'userOptions',
        type: 'list',
        message: 'Please select what would you like to do.',
        choices: [
            'Add Department',
            'Add Role',
            'Add Employee',
            'View Department',
            'View Roles',
            'View Employees',
            'Update An Employee Role',
            'Nevermind',
        ],
    })
.then((answer) => {
    switch (answer.userOptions) {
        case 'Add Department':
            addDept();
            break;

        case 'Add Role':
            addRole();
            break;

        case 'Add Employee':
            addEmp();
            break;
        
        case 'View Departments':
            viewDept();
            break;

        case 'View Roles':
            viewRole();
            break;

        case 'View Employees':
            viewEmp();
            break;

        case 'Update An Employee Role':
            update();
            break;

        case 'Nevermind':
            connection.end();
            break;

        }
    });
};
// Views of all existind Departments 
const viewDept = () => {
    connection.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        res.forEach(({ID, dept_name}) => {
            console.log(`${ID} | ${dept_name}`);
        });
        console.log('-------------');
        start();
    });
}
//Views all existing employee roles
const viewEmp = async () => {
    const emp_Table = await query(
        `SELECT e.id AS 'Employee ID',
        e.first_name AS 'First Name',
        e.last_name AS 'Last Name',
        department.dept_name AS 'Department',
        Emp_role.title AS 'Title',
        CONCAT(m.first_name, ' ', m.last_name)
            AS Manager FROM 
            employee_trackerdb.employee AS e 
        INNER JOIN 
            department ON (emp_role.dept_id = department.ID)
        LEFT JOIN
            employee_trackerdb.employee m ON e.manager_id = m.id
        ORDER BY    
            department.dept_name;`
    );
    console.table(emp_Table);
        start()
    };
const addDept = () => {
    inquirer
    .prompt({
        name: 'addDept',
        type: 'input', 
        message: 'What is the name of the Department you would like to add?',
    })
    .then((answer) => {
        connection.query(
            'INSERT INTO department SET ?',
            {
                dept_name: answer.addDept,
            },
            (err) => {
                if (err) throw err;
                console.log('Department added successfully!');
                start();
            }
        );
    });
};
//Add a role
const addRole = () => {
    inquirer
    .prompt([
        {
            name: 'title',
            type: 'input',
            message: 'Please enter the title of the new Role',
        },
        {
            name: 'salary',
            type: 'input',
            message: 'What is the salary for this role?',
        },
        {
            name: 'dept_id',
            type: 'input',
            message: 'What is the department ID for this role?'
        }
    ])
    .then((answer) => {
        connection.query(
            'INSERT INTO Emp_role SET ?',
            {
                title: answer.title,
                salary: answer.salary,
                dept_id: answer.dept_id,
            },
            (err) => {
                if (err) throw err;
                console.log('New role added!');
                start();
            }
        );
    });
};
//employee add
const addEmp = () => {
    inquirer
    .prompt([
        {
            name: "firstName",
            type: "input",
            message: "Please enter new Employee's first name",
        },
        {
            name: "lastName",
            type: "input",
            message: "Please enter new Employee's last name",
        },
        {
            name: "roleId",
            type: "input",
            message: "What is the ID for this employee's manager?"
        }
    ])
    .then((answer) => {
        connection.query(
            'INSERT INTO employee SET ?',
            {
                first_name: answer.firstName,
                last_name: answer.lastName,
                role_id: answer.roleId,
                manager_id: answer.managerId,
            },
            (err) => {
                if (err) throw err;
                console.log('New employee added!');
                start();
            }
        );
    });
};
// Update existing employee 
const update = () => {
    inquirer.prompt([
        {
            name: 'employee',
            type: 'list',
            message: 'Which Employee would you like to update?',
            choices: () => ListRoles(),
        },
        {
            name: 'newTitle',
            type: 'list',
            message: `What is this employee's new role?`,
            choices: () => ListRoles(),
        },
    ])
    .then(async function (res) {
        const empArray = res.employee.split(" ");
        const empFirst = empArray[0];
        const empLast = empArray[1];
        const newRole = res.newTitle; 
        const updatedRole = await query('SELECT ID FROM emp_role WHERE ?', {
            title: newRole,
        });
        const empID = await query(
            'SELECT ID FROM employee WHERE ? AND ?',
            [{ first_name: empFirst}, {last_name: empLast}]
        );
        await query('UPDATE employee SET ? WHERE ?', [
            {
                role_id: updatedRole[0].ID,
            },
            {
                id: empID[0].ID,
            },
        ]);
        console.log('Role updated!');
        start();
    });
};
const listEmp = async () => {
    let employee;
employees = await query('SELECT * FROM employee');
const employeeName = employees.map((employee) => {
    return `${employee.first_name} ${employee.last_name}`;
});
return employeeName
};
const ListRoles = async () => {
    let titleArray;
    titleArray = await query('SELECT * FROM emp_role');
    const titleList = titleArray.map((position) => {
        return `${position.title}`;
    });
    return titleList;
}
