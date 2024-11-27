const path = require('path');
let embedToken = require(__dirname + '/embedConfigService.js');
const ejs = require('ejs');
const utils = require(__dirname + "/utils.js");
const express = require("express");
const bodyParser = require("body-parser");
const passport = require('passport');
const app = express();
const { error, time } = require('console');
const bcrypt = require('bcrypt');
const sql = require('mssql');
const crypto = require('crypto');
var querystring = require('querystring');
const nodemailer = require('nodemailer');

const session = require('express-session');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitializated: true,
    cookie: { secure: false }
}))

app.use(passport.session());
app.use(passport.initialize());

const PORT = process.env.PORT || 5300;

const transporter = nodemailer.createTransport({

    service: 'gmail',
    auth: {
        user: 'luisflorezjuarez@gmail.com',
        pass: 'yior yyju myvm gjtr'
    }
});

//Conexión con la base de datos Azure
const config = {

    user: 'SA',
    password: 'Minuto93',
    server: 'localhost',
    database: 'master',
    port: 1433,
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
}

//Google Auth
const CLIENT_ID = '332899807819-agk3i5n398a88202l2q03nq081p6r1gd.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: "http://dgtpowerbi.azurewebsites.net/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        console.log(profile)
        return done(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

//Microsoft
var MicrosoftStrategy = require('passport-microsoft').Strategy;

passport.use(new MicrosoftStrategy({
    // Standard OAuth2 options
    clientID: '1372c5d8-e7b9-4f1a-80d3-406f5041b5e0',
    clientSecret: 'p1i8Q~Nls_P3ZXOExdw2UsZWNzJ3dgN3HsKXrdsz',
    callbackURL: "https://dgtpowerbi.azurewebsites.net/auth/microsoft/callback",
    scope: ['user.read', 'mail.read', 'offline_access'],

    tenant: 'common',
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',

    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    graphApiVersion: 'v1.0',
    addUPNAsEmail: false,
    apiEntryPoint: 'https://graph.microsoft.com',
},
    function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        return done(null, profile);
    }
));

var GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
    clientID: 'Ov23liHnVwzm97YyjyiS',
    clientSecret: '6ef4cdb41895274d479128833d9899e53937c1a8',
    callbackURL: "https://dgtpowerbi.azurewebsites.net/auth/github/callback"
},
    function (accessToken, refreshToken, profile, done) {
        done(null, profile);
    }
));

app.get('/auth/github',
    passport.authenticate('github'));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/embed3');
    });

// Prepare server for Bootstrap, jQuery and PowerBI files
app.use('/js', express.static('./node_modules/bootstrap/dist/js/')); // Redirect bootstrap JS
app.use('/js', express.static('./node_modules/jquery/dist/')); // Redirect JS jQuery
app.use('/js', express.static('./node_modules/powerbi-client/dist/')) // Redirect JS PowerBI
app.use('/css', express.static('./node_modules/bootstrap/dist/css/')); // Redirect CSS bootstrap
app.use('/public', express.static('./public/')); // Use custom JS and CSS files

app.set('view engine', 'ejs');

function isLogin(req, res, next) {

    if (req.session.user) {
        return next();
    } else {
        res.redirect('/');
    }
}

function sendEmail(to, subject, text) {

    const emailOptions = {
        from: 'luisflorezjuarez@gmail.com',
        to,
        subject,
        text,
    };

    return transporter.sendMail(emailOptions);
}

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res) {

        res.redirect('/embed3');
    }
)

app.get('/embed', isLogin, (req, res) => {
    res.render('index');
});

app.get('/embed2', isLogin, (req, res) => {
    res.render('index2');
})

app.get('/embed3', function (req, res) {
    res.render('index3');
})

app.get('/logout', function (req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/embed');
        }
        res.clearCookie('userRole');
        res.redirect('/');
    });
});

app.get("/auth/microsoft",
    passport.authenticate("microsoft")
);

app.get("/auth/microsoft/callback", passport.authenticate("microsoft", {
    failureRedirect: '/',
    session: false
}),
    (req, res) => {
        res.redirect('/embed3');
    }
);

app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/register', async (request, response) => {

    const user = request.body.user;
    const name = request.body.name;
    const pass = request.body.pass;
    const email = request.body.email;

    try {
        const pool = await sql.connect(config);
        const existeEmail = await comprobarEmail(pool, email);

        if (existeEmail) {
            response.send("<html><head><title>Alerta</title></head><body><script>alert('Usuario ya creado. Utilize otro email');window.location.href='/register';</script></body></html>");
        } else {

            const hashPassword = await bcrypt.hash(pass, 10);

            const result = await pool.request()
                .input('Usuario', sql.VarChar, user)
                .input('Nombre', sql.VarChar, name)
                .input('Email', sql.VarChar, email)
                .input('Contraseña', sql.VarChar, hashPassword)
                .input('Rol', sql.Int, 0)
                .input('Validado', sql.Bit, 0)
                .query('INSERT INTO dbo.usersdgt (Usuario, Nombre, Email, Contraseña, Rol, Validado) VALUES (@Usuario, @Nombre, @Email, @Contraseña, @Rol, @Validado)');

            const adminEmail = 'lflorj00@estudiantes.unileon.es'
            await sendEmail(
                adminEmail,
                'Nuevo usuario registrado - Validar cuenta',
                `Un nuevo usuario se ha registrado con el correo ${email}. Verifica su cuenta para poder inicar sesión`,
            );

            response.send("<html><head><title>Alerta</title></head><body><script>alert('Usuario creado correctamente. El administrador validará su cuenta');window.location.href='/';</script></body></html>");
        }
    } catch (err) {
        console.error('Error al registrar usuario: ', err);
    }
});

async function comprobarEmail(pool, email) {

    try {
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT COUNT(*) AS count FROM dbo.usersdgt WHERE Email = @Email');

        return result.recordset[0].count > 0;
    } catch (err) {
        console.error('Error al comprobar el correo electrónico: ', err);
        throw err;
    }
}

app.get('/', function (req, res) {
    res.render('login');
});

app.get('/admin', isLogin, function (req, res) {
    res.render('admin');
})

app.post('/admin', async (req, res) => {

    const email = req.body.userEmail;
    const opcion = req.body.informes;

    let valor;

    switch (opcion) {
        case 'todos':
            valor = 3;
            break;
        case 'informe1':
            valor = 1;
            break;
        case 'informe2':
            valor = 2;
            break;
        default:
            valor = 0;
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .input('Rol', sql.Int, valor)
            .input('Validado', sql.Bit, true)
            .query('UPDATE dbo.usersdgt SET Rol = @Rol, Validado = @Validado WHERE Email = @Email');

        await sendEmail(
            email,
            'Cuenta validada',
            'Tu cuenta ha sido validada por el administrador. Ya puedes iniciar sesión.'
        );

        res.send("<html><head><title>Alerta</title></head><body><script>alert('Privilegios otorgados correctamente');window.location.href='/admin';</script></body></html>");

    } catch (err) {
        console.error('Error: ', err);
    }
})

app.get('/listadoinformes', isLogin, function (req, res) {
    res.render('listadoInformes');
});

app.post('/auth', async (req, res) => {
    const email = req.body.emailLogin;
    const password = req.body.passLogin;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM dbo.usersdgt WHERE Email = @Email');

        const user = result.recordset[0];

        if (user) {

            if (email && email != user.Email) {
                res.send("<html><head><title>Alerta</title></head><body><script>alert('Usuario incorrecto');window.location.href='/';</script></body></html>");
            }

            else if (user.Validado == false) {
                res.send("<html><head><title>Alerta</title></head><body><script>alert('El usuario existe pero no esta validado por el administrador');window.location.href='/';</script></body></html>");
            } else {

                bcrypt.compare(password, user.Contraseña, (err, data) => {

                    if (err) throw err

                    if (data == true) {

                        if (email == 'lflorj00@estudiantes.unileon.es') {
                            req.session.user = { email };
                            res.redirect('/admin');

                        } else {
                            req.session.user = {
                                email: user.Email,
                                rol: user.Rol
                            }
                            res.cookie('userRole', user.Rol, {
                                maxAge: 1000 * 60 * 15,
                                secure: false,
                                sameSite: 'strict'
                            });
                            res.redirect('/listadoInformes');
                        }

                    } else {
                        res.send("<html><head><title>Alerta</title></head><body><script>alert('Contraseña incorrecta');window.location.href='/';</script></body></html>");
                    }
                });
            }
        }
        else {
            res.send("<html><head><title>Alerta</title></head><body><script>alert('Usuario no existe');window.location.href='/';</script></body></html>");
        }
    } catch (err) {
        console.error('Error al iniciar sesión: ', err);
    }
});

app.get('/forgot-password', function (req, res) {
    res.render('forgotpass');
});

//Contraseña olvidada
app.post('/forgot-password', async (req, res) => {

    const { email, pass, confirmPass } = req.body;

    if (pass !== confirmPass) {
        res.send("<html><head><title>Alerta</title></head><body><script>alert('Las contraseñas no coinciden');window.location.href='/forgot-password';</script></body></html>");
    } else {

        try {
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('Email', sql.VarChar, email)
                .query('SELECT * FROM dbo.usersdgt WHERE Email = @Email');

            if (result.recordset.length === 0) {
                res.send("<html><head><title>Alerta</title></head><body><script>alert('Usuario no existe');window.location.href='/forgot-password';</script></body></html>");

            } else {
                const hashedPassword = await bcrypt.hash(pass, 10);

                await pool.request()
                    .input('hashedPassword', sql.VarChar, hashedPassword)
                    .input('Email', sql.VarChar, email)
                    .query('UPDATE dbo.usersdgt SET Contraseña = @hashedPassword WHERE Email = @Email');

                    res.send("<html><head><title>Alerta</title></head><body><script>alert('Contraseña cambiada correctamente');window.location.href='/';</script></body></html>");
            }
        } catch (err) {
            console.error('Error al actualizar la contraseña:', err);
            res.status(500).send('Ocurrió un error al actualizar la contraseña.');
        }
    }
});

app.get('/getEmbedToken', async function (req, res) {

    //Valida si se han introducido los parametros en el config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult) {
        return res.status(400).send({
            "error": configCheckResult
        });
    }
    // Obtiene los detalles del Embed URL, el token de acceso y la expiración
    let result = await embedToken.getEmbedInfo();

    res.status(result.status).send(result);
});

app.get('/getEmbedToken2', async function (req, res) {

    //Valida si se han introducido los parametros en el config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult) {
        return res.status(400).send({
            "error": configCheckResult
        });
    }
    // Obtiene los detalles del Embed URL, el token de acceso y la expiración
    let result = await embedToken.getEmbedInfo2();

    res.status(result.status).send(result);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));