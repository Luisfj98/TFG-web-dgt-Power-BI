# TFG-web-dgt-Power-BI

Aplicación web donde diferentes usuarios se pueden registrar y dependiendo de los permisos otorgados por un administrador podrán ver uno o varios reportes creados con la herramienta de power BI. Todos los datos de los usuarios y su contraseña cifrada se almacenan en una bases de datos alojada en un servidor de Azure. 
Los reportes han sido creados a partir de las bases de datos publicas que ofrece la DGT en su plataforma web. En estos reportes se puede interactuar con las diferentes visualizaciones y aplicar varios filtros como la provincia o el año con el objetivo de mejorar la comprensión de grandes bases de datos.

Tecnologías utilizadas:

- HTML: para crear los diferentes elementos gráficos que conforman la plataforma web como la pantalla de login.
- CSS: proporcionar estilo a los elementos como el color de los botones.
- Node.js: entorno de ejecución para crear las funcionalidades de la web como la verificación de la información del usuario con los datos almancenados en la base de datos.
- SQL Server: base de datos que alamcena la información de los usuarios como su nombre o correo electrónico.
- Microsoft Power BI: plataforma que a partir de una base de datos nos permite crear diferentes visualizaciones para que usarios que no tengan conocimientos de analisis de datos lo puedan comprender de una forma sencilla y muy visual.
- Microsoft Azure: nube de microsoft que ofrece difentes servicios en los que utilizado un servidor de bases de datos y despliegue de la aplicación web para que pueda accerder cualquier usuario.
- Docker: una vez finalizada la prueba gratuita de Azure utilice este contenedor para crear un serviodor y asi poder almanecar los datos de los diferentes usuarios que se registran en la aplicación.
