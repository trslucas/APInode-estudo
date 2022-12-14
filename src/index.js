const { response, request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

//Middleware

function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;
    const customer = customers.find((customer) => customer.cpf === cpf);
    if (!customer) {
        return res.status(400).json({ error: "Customer not found" });
    }
    request.customer = customer;
    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    return res.status(201).send();
});

// app.use(verifyIfExistsAccountCPF)

app.get("/statement/", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);

    const customerData = {
        customer,
        balance,
    };

    return res.json(customerData);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = request;
    const { description, amount } = req.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = request;
    const { amount } = req.body;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ error: "Insuficient funds!" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = request;

    const { date } = req.query;
    const dateFormat = new Date(date + " 00:00");

    const dateStatement = customer.statement.filter(
        (statement) =>
        statement.created_at.toDateString() ===
        new Date(dateFormat).toDateString()
    );

    //usar data em formato americano
    return res.json(dateStatement);
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = request;
    const { name } = req.body;

    customer.name = name;

    return res.status(201).send();
});

app.delete("/account", verifyIfExistsAccountCPF, (request, res) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return res.status(200).json(customers);
});

app.listen(3333);