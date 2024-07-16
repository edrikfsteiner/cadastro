document.addEventListener('DOMContentLoaded', function () {
    // Inicializa o banco de dados
    alasql(`
        CREATE LOCALSTORAGE DATABASE IF NOT EXISTS agrosqldb;
        ATTACH LOCALSTORAGE DATABASE agrosqldb;
        USE agrosqldb;
    `);

    alasql(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER AUTOINCREMENT PRIMARY KEY,
            username STRING UNIQUE,
            password STRING
        );
    `);

    alasql(`
        CREATE TABLE IF NOT EXISTS clients (
            cpf STRING PRIMARY KEY,
            name STRING,
            birthdate DATE,
            phone STRING,
            cellphone STRING
        );
    `);

    alasql(`
        CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER AUTOINCREMENT PRIMARY KEY,
            cep STRING,
            street STRING,
            district STRING,
            city STRING,
            state STRING,
            country STRING,
            client_cpf STRING,
            main BOOLEAN,
            FOREIGN KEY (client_cpf) REFERENCES clients(cpf)
        );
    `);

    // Função para verificar login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;

            var result = alasql('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

            if (result.length > 0) {
                window.location.href = 'client.html';
            } else {
                alert('Usuário ou senha incorretos');
            }
        });
    }

    // Função para cadastrar novo usuário
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', function () {
            var username = prompt("Informe o nome do usuário:");
            var password = prompt("Informe a senha:");

            if (username && password) {
                var existingUser = alasql('SELECT * FROM users WHERE username = ?', [username]);

                if (existingUser.length > 0) {
                    alert('Usuário já cadastrado!');
                } else {
                    try {
                        alasql('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
                        alert('Usuário cadastrado com sucesso!');
                    } catch (error) {
                        alert('Erro: ' + error.message);
                    }
                }
            }
        });
    }

    // Função para importar banco de dados
    const configButton = document.getElementById('config-button');
    if (configButton) {
        configButton.addEventListener('click', function () {
            document.getElementById('db-upload').click();
        });
    }

    const dbUpload = document.getElementById('db-upload');
    if (dbUpload) {
        dbUpload.addEventListener('change', function (e) {
            var file = e.target.files[0];
            var reader = new FileReader();

            reader.onload = function (e) {
                var contents = e.target.result;
                var data = JSON.parse(contents);

                alasql('ATTACH LOCALSTORAGE DATABASE agrosqldb;');
                alasql('USE agrosqldb;');

                // Limpando as tabelas antes de importar
                alasql('DROP TABLE IF EXISTS users');
                alasql('DROP TABLE IF EXISTS clients');
                alasql('DROP TABLE IF EXISTS addresses');

                alasql(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER AUTOINCREMENT PRIMARY KEY,
                        username STRING UNIQUE,
                        password STRING
                    );
                `);

                alasql(`
                    CREATE TABLE IF NOT EXISTS clients (
                        cpf STRING PRIMARY KEY,
                        name STRING,
                        birthdate DATE,
                        phone STRING,
                        cellphone STRING
                    );
                `);

                alasql(`
                    CREATE TABLE IF NOT EXISTS addresses (
                        id INTEGER AUTOINCREMENT PRIMARY KEY,
                        cep STRING,
                        street STRING,
                        district STRING,
                        city STRING,
                        state STRING,
                        country STRING,
                        client_cpf STRING,
                        main BOOLEAN,
                        FOREIGN KEY (client_cpf) REFERENCES clients(cpf)
                    );
                `);

                data.users.forEach(user => {
                    alasql('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [user.id, user.username, user.password]);
                });

                data.clients.forEach(client => {
                    alasql('INSERT INTO clients (cpf, name, birthdate, phone, cellphone) VALUES (?, ?, ?, ?, ?)', 
                        [client.cpf, client.name, client.birthdate, client.phone, client.cellphone]);
                });

                data.addresses.forEach(address => {
                    alasql('INSERT INTO addresses (id, cep, street, district, city, state, country, client_cpf, main) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                        [address.id, address.cep, address.street, address.district, address.city, address.state, address.country, address.client_cpf, address.main]);
                });

                alert('Banco de dados importado com sucesso!');
                
                // Atualiza as listas após a importação
                if (window.location.pathname.endsWith('client.html')) {
                    listClients();
                }
                if (window.location.pathname.endsWith('address.html')) {
                    listAddresses();
                }
            };

            reader.readAsText(file);
        });
    }

    // Função para cadastrar clientes
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', function addClient(e) {
            e.preventDefault();

            var name = document.getElementById('name').value;
            var cpf = document.getElementById('cpf').value;
            var birthdate = document.getElementById('birthdate').value;
            var phone = document.getElementById('phone').value;
            var cellphone = document.getElementById('cellphone').value;

            var existingClient = alasql('SELECT * FROM clients WHERE cpf = ?', [cpf]);
            if (existingClient.length > 0) {
                // Se cliente existe, atualize o cliente existente
                alasql('UPDATE clients SET name = ?, birthdate = ?, phone = ?, cellphone = ? WHERE cpf = ?', 
                    [name, birthdate, phone, cellphone, cpf]);
                alert('Cliente atualizado com sucesso!');
            } else {
                // Se cliente não existe, adicione um novo cliente
                alasql('INSERT INTO clients (cpf, name, birthdate, phone, cellphone) VALUES (?, ?, ?, ?, ?)', 
                    [cpf, name, birthdate, phone, cellphone]);
                alert('Cliente cadastrado com sucesso!');
            }
            
            listClients();
            this.reset();
            document.getElementById('cpf').removeAttribute('readonly');
        });
    }

    function listClients() {
        var clients = alasql('SELECT * FROM clients');
        var clientList = document.getElementById('client-list');
        clientList.innerHTML = '';

        clients.forEach(client => {
            var row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.cpf}</td>
                <td>${client.birthdate}</td>
                <td>${client.phone}</td>
                <td>${client.cellphone}</td>
                <td class="edit-delete">
                    <button class="edit-client" data-cpf="${client.cpf}">Editar</button>
                    <button class="delete-client" data-cpf="${client.cpf}">Deletar</button>
                </td>
            `;
            clientList.appendChild(row);
        });

        document.querySelectorAll('.edit-client').forEach(button => {
            button.addEventListener('click', function () {
                var cpf = this.getAttribute('data-cpf');
                editClient(cpf);
            });
        });

        document.querySelectorAll('.delete-client').forEach(button => {
            button.addEventListener('click', function () {
                var cpf = this.getAttribute('data-cpf');
                deleteClient(cpf);
            });
        });
    }

    function editClient(cpf) {
        var client = alasql('SELECT * FROM clients WHERE cpf = ?', [cpf])[0];
        if (client) {
            document.getElementById('name').value = client.name;
            document.getElementById('cpf').value = client.cpf;
            document.getElementById('birthdate').value = client.birthdate;
            document.getElementById('phone').value = client.phone;
            document.getElementById('cellphone').value = client.cellphone;

            document.getElementById('cpf').setAttribute('readonly', 'readonly');

            clientForm.removeEventListener('submit', addClient());
            clientForm.addEventListener('submit', function updateClient(e) {
                e.preventDefault();

                try {
                    alasql('UPDATE clients SET name = ?, birthdate = ?, phone = ?, cellphone = ? WHERE cpf = ?', 
                        [client.name, client.birthdate, client.phone, client.cellphone, client.cpf]);
                    alert('Cliente atualizado com sucesso!');
                    listClients();
                    clientForm.reset();
                    document.getElementById('cpf').removeAttribute('readonly');
                    clientForm.removeEventListener('submit', updateClient);
                    clientForm.addEventListener('submit', addClient());
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
            });
        }
    }

    function deleteClient(cpf) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                alasql('DELETE FROM clients WHERE cpf = ?', [cpf]);
                alert('Cliente excluído com sucesso!');
                listClients();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        }
    }

    if (window.location.pathname.endsWith('client.html')) {
        listClients();
    }

    // Função para cadastrar endereços
    const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', function addAddress() {
            var addressId = document.getElementById('address-id').value;
            var cep = document.getElementById('cep').value;
            var street = document.getElementById('street').value;
            var district = document.getElementById('district').value;
            var city = document.getElementById('city').value;
            var state = document.getElementById('state').value;
            var country = document.getElementById('country').value;
            var clientCpf = document.getElementById('client-cpf').value;
            var main = document.getElementById('main').checked;
            
            // Verifica se o cliente existe
            var existingClient = alasql('SELECT * FROM clients WHERE cpf = ?', [clientCpf]);
            if (existingClient.length === 0) {
                alert('CPF do cliente não encontrado!');
                return;
            }

            // Verifica se já existe um endereço principal para este cliente
            if (main) {
                var existingMain = alasql('SELECT * FROM addresses WHERE client_cpf = ? AND main = true', [clientCpf]);
                if (existingMain.length > 0 && !addressId) {
                    alert('Já existe um endereço principal para este cliente!');
                    return;
                }
            }

            // Se o endereço já existe, atualize
            if (addressId) {
                alasql('UPDATE addresses SET cep = ?, street = ?, district = ?, city = ?, state = ?, country = ?, client_cpf = ?, main = ? WHERE id = ?', 
                    [cep, street, district, city, state, country, clientCpf, main, addressId]);
                alert('Endereço atualizado com sucesso!');
            } else {
                alasql('INSERT INTO addresses (cep, street, district, city, state, country, client_cpf, main) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                    [cep, street, district, city, state, country, clientCpf, main]);
                alert('Endereço cadastrado com sucesso!');
            }

            listAddresses();
            this.reset();
            document.getElementById('client-cpf').removeAttribute('readonly');
        });
    }
    
    window.listAddresses = function() {
        var addresses = alasql('SELECT * FROM addresses');
        var addressList = document.getElementById('address-list');
        addressList.innerHTML = '';

        addresses.forEach(address => {
            var row = document.createElement('tr');
            row.innerHTML = `
                <td>${address.cep}</td>
                <td>${address.street}</td>
                <td>${address.district}</td>
                <td>${address.city}</td>
                <td>${address.state}</td>
                <td>${address.country}</td>
                <td>${address.client_cpf}</td>
                <td>${address.main ? 'Sim' : 'Não'}</td>
                <td class="edit-delete">
                    <button class="edit-address" data-id="${address.id}" onclick="editAddress(${address.id})">Editar</button>
                    <button class="delete-address" data-id="${address.id}" onclick="deleteAddress(${address.id})">Deletar</button>
                </td>
            `;
            addressList.appendChild(row);
        });
    }

    window.editAddress = function(id) {
        var address = alasql('SELECT * FROM addresses WHERE id = ?', [id])[0];
        if (address) {
            document.getElementById('cep').value = address.cep;
            document.getElementById('street').value = address.street;
            document.getElementById('district').value = address.district;
            document.getElementById('city').value = address.city;
            document.getElementById('state').value = address.state;
            document.getElementById('country').value = address.country;
            document.getElementById('client-cpf').value = address.client_cpf;
            document.getElementById('main').checked = address.main;
            document.getElementById('address-id').value = address.id;

            document.getElementById('client-cpf').setAttribute('readonly', 'readonly');

            clientForm.removeEventListener('submit', addAddress());
            addressForm.addEventListener('submit', function updateAddress() {
                alasql('UPDATE addresses SET cep = ?, street = ?, district = ?, city = ?, state = ?, country = ?, client_cpf = ?, main = ? WHERE id = ?', 
                    [address.cep, address.street, address.district, address.city, address.state, address.country, address.client_cpf, address.main, address.id]);
                listAddresses();
                addressForm.reset();
                document.getElementById('client-cpf').removeAttribute('readonly');
                addressForm.removeEventListener('submit', updateAddress);
                clientForm.addEventListener('submit', addAddress());
                alert('Endereço atualizado com sucesso!');
            });
        }
    }

    window.deleteAddress = function(id) {
        if (confirm('Tem certeza que deseja excluir este endereço?')) {
            alasql('DELETE FROM addresses WHERE id = ?', [id]);
            alert('Endereço excluído com sucesso!');
            listAddresses();
        }
    }

    if (window.location.pathname.endsWith('address.html')) {
        listAddresses();
    }

    // Exportar banco de dados
    const dbExport = document.getElementById('dbExport');
    if (dbExport) {
        dbExport.addEventListener('click', function (e) {
            e.preventDefault();

            var users = alasql('SELECT * FROM users');
            var clients = alasql('SELECT * FROM clients');
            var addresses = alasql('SELECT * FROM addresses');

            var data = {
                users: users,
                clients: clients,
                addresses: addresses
            };

            var serializedData = JSON.stringify(data);
            var blob = new Blob([serializedData], { type: 'application/json' });
            var url = URL.createObjectURL(blob);

            var a = document.createElement('a');
            a.href = url;
            a.download = 'database_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Botão para redirecionar para a página de endereços
    const addressRegisterButton = document.getElementById('address-register-button');
    if (addressRegisterButton) {
        addressRegisterButton.addEventListener('click', function () {
            window.location.href = 'address.html';
        });
    }
});