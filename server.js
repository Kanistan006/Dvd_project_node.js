const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');

const memberController = require('./controllers/memberController');

const server = http.createServer(function (req, res) {

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET') {
        if (pathname === '/members') {
            memberController.listMembers(req, res);
        } else if (pathname.startsWith('/members/view')) {
            const memberid = parsedUrl.query.memberId;
            memberController.viewMember(req, res, memberid);
        } else if (pathname === '/members/add') {
            fs.readFile('./views/addMember.html', (err, data) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(data);
                res.end();
            });
        } else if (pathname === '/members/edit' && parsedUrl.query.memberId) {
            memberController.editMember(req, res, parsedUrl.query.memberId);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Page Not Found</h1>');
        }
    } else if (req.method === 'POST') {
        if (pathname === '/members/add') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const formData = qs.parse(body);      
                memberController.addMember(req, res, formData);
            });
        } else if (pathname === '/members/update') {

            let body = '';

            req.on('data', chunk => {
                body += chunk.toString(); // Convert Buffer to string
            });

            req.on('end', () => {
                const formData = qs.parse(body);
                memberController.updateMember(req, res, formData);
            });
        }
    }


});

server.listen(3000, function () {
    console.log('Server running on port 3000');
});
