const db = require('../db');

// Generate a random Employee ID (MEM_XXXX)
const generateMemberId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = 'MEM_';
    for (let i = 0; i < 4; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
};

// List all Employees
function listMembers(req, res) {
    db.all(`SELECT * FROM members`, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<!DOCTYPE html>')
        res.write('<html>');
        res.write('<head>');
        res.write(
            `<style> 
            
            body{
                background-color:yellow;
            }

            a{
                text-decoration:none;
            }
            
            </style>`)
        res.write('</head>');
        res.write('<body>');
        res.write('<h1 style="color:red;">Members</h1>');
        res.write('<a href="/members/add">Add member</a>');
        res.write('<table border="1">');
        res.write('<tr><th>member ID</th><th>First Name</th><th>Last Name</th><th>DOB</th></tr>');
        rows.forEach((row) => {
            res.write(`<tr> 
                <td>${row.id}</td>  
                <td> ${row.firstname}</td> 
                <td> ${row.lastname}</td> 
                <td>${row.dob}</td> 
                <td><a href="/members/view?memberId=${row.id}">view</a></td> 
                <td><a href="/members/edit?memberId=${row.id}">edit</a></td> 
                </tr>`);
        });
        res.write('</table>');
        // res.write(
        //     `<script>
        //     document.addEventListener('DOMContentLoaded',function(){
        //     console.log('print message in browser console in List Member');
        //         alert('Hi , testing Client javascript render in List Member');
        //         })
        //     </script>`)
        res.write('</body>');
        res.write('</html>');
        res.end();
    });
}

// View a single employee with contact details
function viewMember(req, res, memberId) {
    db.get(`SELECT * FROM members WHERE id = ?`, [memberId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h1>Member Not Found</h1>');
            return res.end();
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("<a href='/members'>back</a>");
        res.write(`<h1>${row.firstname} ${row.lastname}</h1><p>DOB: ${row.dob}</p>`);

        // db.all(`SELECT * FROM MemberContact WHERE memberId = ?`, [employeeId], (err, contacts) => {
        //     if (err) return console.error(err.message);
        //     res.write('<h2>Contact Details</h2>');
        //     contacts.forEach((contact) => {
        //         res.write(`<p>Phone Numbers: ${contact.phoneNumbers}</p><p>Addresses: ${contact.addresses}</p>`);
        //     });
        //     res.end();
        // });
    });
}

function viewMemberWithJoin(req, res, memberId) {
    const sql = `
        SELECT e.id, e.firstname, e.lastname, e.dob, 
               ec.phoneNumbers, ec.addresses 
        FROM Member e
        LEFT JOIN MemberContact ec 
        ON e.id = ec.memberId
        WHERE e.id = ?
    `;

    db.get(sql, [memberId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h1>Member Not Found</h1>');
            return res.end();
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(`<h1>${row.firstname} ${row.lastname}</h1>`);
        res.write(`<p>DOB: ${row.dob}</p>`);
        res.write(`<h2>Contact Details</h2>`);
        res.write(`<p>Phone Numbers: ${row.phoneNumbers ? row.phoneNumbers : 'N/A'}</p>`);
        res.write(`<p>Addresses: ${row.addresses ? row.addresses : 'N/A'}</p>`);
        res.end();
    });
}

// Add new employee
function addMember(req, res, formData) {
    const memberId = generateMemberId();
    const { firstname, lastname, dob} = formData;

    db.run(
        `INSERT INTO members (id, firstname, lastname, dob) VALUES (?, ?, ?, ?)`,
        [memberId, firstname, lastname, dob],
        function (err) {
            if (err){ return console.error(err.message);}

            res.writeHead(302, { Location: '/members' });
            res.end();
            
        }
    );
}

// Delete employee
function deleteMember(req, res, memberId) {
    db.run(`DELETE FROM members WHERE id = ?`, [memberId], function (err) {
        if (err) return console.error(err.message);
        res.writeHead(302, { Location: '/members' });
        res.end();
    });
}

function editMember(req, res, memberId) {
    const sql = `SELECT e.id, e.firstname, e.lastname, e.dob FROM members e WHERE e.id = ?`;

    db.get(sql, [memberId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Member Not Found</h1>');
            return;
        }

        // Dynamically generate the Edit Employee HTML form
        let html = `
            <html>
            <head>
                <title>Edit Member</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    label { display: inline-block; width: 100px; margin-bottom: 10px; }
                    input { padding: 5px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>Edit Member</h1>
                <form action="/members/update" method="POST">
                    <input type="hidden" name="id" value="${row.id}">
                    <label>First Name:</label>
                    <input type="text" name="firstname" value="${row.firstname}">
                    <br>
                    <label>Last Name:</label>
                    <input type="text" name="lastname" value="${row.lastname}">
                    <br>
                    <label>Date of Birth:</label>
                    <input type="date" name="dob" value="${row.dob}">
                    <br>
                    <button type="submit">Update</button>
                </form>
                <a href="/members">Back to List</a>
            </body>
            </html>
        `;

        // Send the dynamically generated HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
}

function updateMember(req, res, formData) {
    const id = formData.id;
    const firstname = formData.firstname;
    const lastname = formData.lastname;
    const dob = formData.dob;

    const sql = `UPDATE members 
    SET firstname = ?, lastname = ?, dob = ? 
    WHERE id = ?`;

    db.run(sql, [firstname, lastname, dob, id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        // After updating, redirect back to the employee list
        res.writeHead(302, { 'Location': '/members' });
        res.end();
    });
}




module.exports = {
    listMembers,
    viewMember,
    viewMemberWithJoin,
    addMember,
    editMember,
    updateMember,
    deleteMember
};
