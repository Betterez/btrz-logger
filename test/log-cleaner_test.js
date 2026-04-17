const assert = require("node:assert/strict");
const {IncomingMessage} = require("node:http");
const {describe, it, beforeEach} = require("node:test");
const Chance = require("chance");
const logCleaner = require("../src/log-cleaner");

const chance = new Chance();

function randomCapitalization(string) {
  return string.split("").map((character) => {
    const shouldCapitalize = chance.bool();
    return shouldCapitalize? character.toUpperCase() : character;
  }).join("");
}

function trimAllLines(string) {
  return string.split("\n").map((line) => line.trim()).join("\n");
}

function createAxiosError({
  code = "ERR_BAD_REQUEST",
  method = "GET",
  baseURL = "https://sandbox-api.betterez.com",
  url = "/sales",
  status = 400,
  data = {
    password: "some-password",
    date: "2024-01-01T12:00:00.000Z",
  },
} = {}) {
  return {
    code,
    config: {
      method,
      baseURL,
      url,
    },
    constructor: {
      name: "AxiosError",
    },
    response: {
      status,
      data,
    },
  };
}

describe("logCleaner", () => {
  let testString = "";
  let testArgs;

  describe("sanitizeUrlRawParameters::cleanUrlRawParameter", () => {
    beforeEach(() => {
      testString = '[btrz-vue-websales-res] server_id="localhost" remoteaddr="::ffff:127.0.0.1" xapikey="-" responsetime=688.9 date="2019-02-25T13:55:50.468Z" amzn_trace_id="-" grafana_trace_id="-" method=POST url="/cart/4f74a235b0dffc0210000015/cart?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041:1&hasAirlines=false&hasSeatmaps=false&passengers[0][fareId]=4f74b718b0dffc0210000041&passengers[0][fare]=Adults&passengers[0][ssrs]=&passengers[0][firstName]=John,%20Jr.&passengers[0][lastName]=Mc%27%20Snow&passengers[0][email]=johnSnow@winterfell.com&=on" http=1.1 status=302 responselength=164 referrer="http://localhost:8000/cart/4f74a235b0dffc0210000015/reservation/4fba465b0164ad3a55000003/passengers?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041%3A1&hasAirlines=false&hasSeatmaps=false&departureTrip=eyJhY2NvdW50SWQiOiI0Zjc0YTIzNWIwZGZmYzAyMTAwMDAwMTUiLCJwcm9kdWN0SWQiOiI0ZmJhNDY1YjAxNjRhZDNhNTUwMDAwMDMiLCJvcmlnaW5JZCI6IjUxZWQyYWU3Y2YyYzgxOWQ1ZTAwMDAwMyIsImRlc3RpbmF0aW9uSWQiOiI1MWVkMmIwOGNmMmM4MTlkNWUwMDAwMDkiLCJmYXJlSWRzIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxOjEiLCJkZXBhcnR1cmVEYXRlIjoiMjAxOS0wMi0yOCIsImRlcGFydHVyZVRpbWUiOiIwMDoyMCIsInRyaXBEaXJlY3Rpb24iOiJvdXRib3VuZCIsImNoYW5uZWwiOiJ3ZWJzYWxlcyIsInNlZ21lbnRzIjpbeyJyb3V0ZUlkIjoiNTFlZDJiZTNjZjJjODE5ZDVlMDAwMDEwIiwic2NoZWR1bGVJZCI6Ik1vcm5pbmciLCJvcmlnaW4iOiJCZWxsdmlldyIsImRlc3RpbmF0aW9uIjoiQmVuZCJ9XSwiZmFyZXMiOlt7ImlkIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxIiwidmFsdWUiOjUyNDcwMDB9XSwiZmFyZUNsYXNzZXMiOltdLCJ0aWNrZXRUeXBlIjoib25ld2F5In0&passengers%5B0%5D%5BfareId%5D=4f74b718b0dffc0210000041&passengers%5B0%5D%5Bfare%5D=Adults&passengers%5B0%5D%5Bssrs%5D=&passengers%5B0%5D%5BfirstName%5D=John%2C%20Jr.&passengers%5B0%5D%5BlastName%5D=Mc%27%20Snow&passengers%5B0%5D%5Bemail%5D=johnSnow%40winterfell.com&=on" useragent="Mozilla/5.0 (X11; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0"';
    });

    it("should keep the product information", () => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      assert.ok(sanitizedValue.includes("productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway"));
    });

    it("should remain the form and to information", () => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      assert.ok(sanitizedValue.includes("from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009"));
    });

    it("should remove the first name on a given buffer", () => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      assert.ok(!sanitizedValue.includes("John"));
      assert.ok(!sanitizedValue.includes("John, Jr."));
      assert.ok(!sanitizedValue.includes("John,%20Jr."));
    });

    it("should remove the last name on a given buffer", () => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      assert.ok(!sanitizedValue.includes("Snow"));
      assert.ok(!sanitizedValue.includes("Mc'"));
      assert.ok(!sanitizedValue.includes("Mc' Snow"));
      assert.ok(!sanitizedValue.includes("Mc%27%20Snow"));
    });

    it("should remove the email information on a given buffer", () => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      assert.ok(!sanitizedValue.includes("johnSnow"));
      assert.ok(!sanitizedValue.includes("winterfell"));
      assert.ok(!sanitizedValue.includes("johnSnow@winterfell.com"));
      assert.ok(!sanitizedValue.includes("johnSnow%40winterfell.com"));
    });
  });

  describe("sanitize::clean_credit cards, request and emails", () => {
    it("should remove the (Visa credit card) on a given buffer", () => {
      testArgs = [`"ccnumber": "4111111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(!sanitizedValue[0].includes("4111111111111111"));
      assert.ok(sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should remove the (MasterCard credit card) on a given buffer", () => {
      testArgs = [`"ccnumber": "2720111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(!sanitizedValue[0].includes("2720111111111111"));
      assert.ok(sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should remove the (Amex credit card) on a given buffer", () => {
      testArgs = [`"ccnumber": "342011111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(!sanitizedValue[0].includes("342011111111111"));
      assert.ok(sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should remove the (Discover credit card) on a given buffer", () => {
      testArgs = [`"ccnumber": "6552011111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(!sanitizedValue[0].includes("6552011111111111"));
      assert.ok(sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should remove the (JCB credit card) on a given buffer", () => {
      testArgs = [`"ccnumber": "3512131415161718"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(!sanitizedValue[0].includes("3512131415161718"));
      assert.ok(sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should not modify its input when the input is an array", () => {
      testArgs = [`"ccnumber": "3512131415161718"`];
      const sanitizedValue = logCleaner.sanitize(testArgs);
      assert.notDeepStrictEqual(sanitizedValue, [`"ccnumber": "3512131415161718"`]);
      assert.deepStrictEqual(testArgs, [`"ccnumber": "3512131415161718"`]);
    });

    it("should not remove a number on a given buffer if it does not match a known cc format", () => {
      testArgs = [`"ccnumber": "8111111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(sanitizedValue[0].includes("8111111111111111"));
      assert.ok(!sanitizedValue[0].includes("regx.ccnumber.replaced"));
    });

    it("should do nothing if args is not not an array (should always be an array)", () => {
      testArgs = `"ccnumber": "8111111111111111"`;
      let sanitizedValue = logCleaner.sanitize(testArgs);
      assert.ok(sanitizedValue.includes("8111111111111111"));
      assert.ok(!sanitizedValue.includes("regx.ccnumber.replaced"));
    });

    it("should work fine and log an Error object", () => {
      const sanitizedValue = logCleaner.sanitize([new Error("THIS_ERROR")]);
      assert.ok(sanitizedValue[0].message.includes("THIS_ERROR"));
    });

    it("should remove sensitive fields from objects", () => {
      const exampleSensitiveFieldNames = ["email", "mail", "username", "password", "pass", "ccnumber", "ccard",
        "credentials", "user", "firstname", "lastname", "address", "phone", "didyoumean", "createdbyuseremail",
        "updatedbyuseremail", "authorization", "apikey", "x-api-key", "key", "privatekey", "token", "secret", "secrets",
        "secret_key"].map(randomCapitalization);

      const targetObject = {
        ...Object.fromEntries(exampleSensitiveFieldNames.map(fieldName => [fieldName, chance.word()]))
      };

      const sanitizedValue = logCleaner.sanitize(targetObject);
      assert.strictEqual(Object.keys(sanitizedValue).length, Object.keys(targetObject).length);
      assert.deepStrictEqual(sanitizedValue, {
        ...Object.fromEntries(exampleSensitiveFieldNames.map(fieldName => [fieldName, "***"]))
      });
    });

    it("should remove sensitive fields that are contained in sets", () => {
      const sanitizedValue = logCleaner.sanitize(new Set([{password: "abc123"}, `"ccnumber": "3512131415161718"`]));
      assert.deepStrictEqual(sanitizedValue, new Set([{password: "***"}, `"ccnumber": "regx.ccnumber.replaced"`]));
    });

    it("should replace a Buffer with an empty Buffer since buffers can contain arbitrary data, including secrets", () => {
      const buffer = new Buffer("some-secret-password");
      const sanitizedValue = logCleaner.sanitize(buffer);
      assert.ok(sanitizedValue instanceof Buffer);
      assert.strictEqual(sanitizedValue.toString(), "");
    });

    it("should recognize sensitive fields in objects when the field name contains non-alphanumeric characters", () => {
      const targetObject = {
        "__p-a=s:s_ wo+rd;": "some password"
      };
      const sanitizedValue = logCleaner.sanitize(targetObject);
      assert.deepStrictEqual(sanitizedValue, {
        "__p-a=s:s_ wo+rd;": "***"
      });
    });

    it("should not change non-sensitive fields in objects", () => {
      const targetObject = {
        password: "some password",
        passengerId: "1234",
        creationDate: "2024-01-01T12:00:00.000Z",
      };

      const sanitizedValue = logCleaner.sanitize(targetObject);
      assert.deepStrictEqual(sanitizedValue, {
        password: "***",
        passengerId: "1234",
        creationDate: "2024-01-01T12:00:00.000Z",
      });
    });

    it("should not modify its input when the input contains an object", () => {
      const objArg = {
        email: "some-user@betterez.com",
        nestedObject: {
          password: "some-password",
        }
      };
      const sanitizedValue = logCleaner.sanitize([objArg]);
      assert.notDeepStrictEqual(sanitizedValue, [{
        email: "some-user@betterez.com",
        nestedObject: {
          password: "some-password",
        }
      }]);
      assert.deepStrictEqual(objArg, {
        email: "some-user@betterez.com",
        nestedObject: {
          password: "some-password",
        }
      });
    });

    it("should remove sensitive data in nested objects", () => {
      const objArg = {
        status: "ok",
        result: {
          raw: 1,
          info: {
            password: "some-secret",
            user: "admin",
            email: "some-admin@betterez.com",
          }
        }
      };
      let sanitizedValue = logCleaner.sanitize([objArg]);
      assert.strictEqual(Object.keys(sanitizedValue[0]).length, Object.keys(objArg).length);
      assert.strictEqual(sanitizedValue[0].result.info.email, "***");
      assert.strictEqual(sanitizedValue[0].result.info.user, "***");
      assert.strictEqual(sanitizedValue[0].result.info.password, "***");
    });

    it("should remove emails in JSON.stringify strings inside objects", () => {
      const objArg = {
        status: "ok",
        result: {
          raw: 1,
          info: `{"info":{"user":"admin","email":"some-admin@betterez.com"}}`
        }
      };
      let sanitizedValue = logCleaner.sanitize([objArg]);
      assert.strictEqual(Object.keys(sanitizedValue[0]).length, Object.keys(objArg).length);
      assert.ok(!sanitizedValue[0].result.info.includes("some-admin@betterez.com"));
    });

    it("should recognize the non-enumerable properties of an object, and return a new object which has the same list of non-enumerable properties", () => {
      const targetObject = {
        someProperty: "some value"
      };
      Object.defineProperty(targetObject, "someNonEnumerableProperty", {
        value: "some other value",
        enumerable: false
      });

      const sanitizedValue = logCleaner.sanitize(targetObject);
      assert.notStrictEqual(sanitizedValue, targetObject);
      assert.deepStrictEqual(sanitizedValue, {
        someProperty: "some value",
        // Chai does not run assertions on non-enumerable properties when using .eql(...)
      });
      assert.ok(Object.hasOwn(sanitizedValue, "someNonEnumerableProperty"));
      assert.strictEqual(sanitizedValue.propertyIsEnumerable("someNonEnumerableProperty"), false);
    });

    it("should return Error objects without any modifications", () => {
      const error = new Error("Some error message");
      const sanitizedValue = logCleaner.sanitize(error);
      assert.strictEqual(sanitizedValue, error);
    });

    it("should return Date objects without any modifications", () => {
      const date = new Date();
      const sanitizedValue = logCleaner.sanitize(date);
      assert.strictEqual(sanitizedValue, date);
    });

    it("should return booleans without any modifications", () => {
      assert.strictEqual(logCleaner.sanitize(true), true);
      assert.strictEqual(logCleaner.sanitize(false), false);
    });

    it("should simplify a NodeJS 'IncomingMessage' and return only its 'headers' and 'body'", () => {
      const incomingMessage = new IncomingMessage();
      incomingMessage.headers = {
        "content-type": "application/json",
        "x-api-key": "application/json"
      };
      incomingMessage.body = {
        someProperty: "some value",
        password: "some password",
      };

      const sanitizedValue = logCleaner.sanitize(incomingMessage);
      assert.deepStrictEqual(sanitizedValue, {
        body: {
          password: "***",
          someProperty: "some value"
        },
        headers: {
          "content-type": "application/json",
          "x-api-key": "***"
        }
      });
    });

    it("should simplify AxiosErrors and not return sensitive headers", () => {
      const error = createAxiosError({
        method: "POST",
        status: 401,
        data: "Unauthorized",
      });

      const sanitizedValue = logCleaner.sanitize([error]);
      assert.strictEqual(sanitizedValue[0], "[ERR_BAD_REQUEST] Request failed with status 401: [POST] https://sandbox-api.betterez.com/sales\nUnauthorized");
    });

    it("should return the expected string when sanitizing an AxiosError which contains information about the API response that caused the error", () => {
      const sanitizedValue = logCleaner.sanitize(createAxiosError());
      assert.strictEqual(sanitizedValue, trimAllLines(
        `[ERR_BAD_REQUEST] Request failed with status 400: [GET] https://sandbox-api.betterez.com/sales
        { password: '***', date: '2024-01-01T12:00:00.000Z' }`
      ));
    });

    it("should truncate the result when sanitizing an AxiosError which contains a very large request body", () => {
      const error = createAxiosError();
      error.response.data = chance.string({length: 5000});

      const sanitizedValue = logCleaner.sanitize(error);
      assert.strictEqual(sanitizedValue.length, 4096);
      assert.match(sanitizedValue, /\[TRUNCATED\]$/);
    });

    it("should correctly sanitize an AxiosError which resulted from a request which had no 'baseURL'", () => {
      const error = createAxiosError({
        method: "POST",
        baseURL: "",
        url: "https://sandbox-api.betterez.com/sales",
        status: 401,
        data: "Unauthorized",
      });

      const sanitizedValue = logCleaner.sanitize([error]);
      assert.strictEqual(sanitizedValue[0], "[ERR_BAD_REQUEST] Request failed with status 401: [POST] https://sandbox-api.betterez.com/sales\nUnauthorized");
    });

    it("should not mutate its input when the input contains an AxiosError", () => {
      const error = createAxiosError();

      logCleaner.sanitize(error);
      assert.deepStrictEqual(error.response, {
        status: 400,
        data: {
          password: "some-password",
          date: "2024-01-01T12:00:00.000Z"
        }
      });
    });

    it("should not throw an error when sanitizing input which is 'null'", () => {
      assert.strictEqual(logCleaner.sanitize(null), null);
    });

    it("should not throw an error when sanitizing input which is 'undefined'", () => {
      assert.strictEqual(logCleaner.sanitize(undefined), undefined);
    });

    it("should protect against people logging ridiculously large objects (such as the Express 'req' or 'res' objects) by limiting the amount of time that can be spent on sanitization, and truncating the sanitized value if the process takes too long", () => {
      // If a developer accidentally tries to log the Express 'req' or 'res' objects, it will take multiple seconds for
      // the sanitization routine to traverse these objects, since they are very large and may also contain
      // circular references.  As a last resort to prevent this situation from taking down a server, we limit the
      // amount of time that the sanitizer is allowed to spend traversing the input, and then truncate the result if
      // the time budget is exceeded.

      function getObjectWithOneThousandProperties({childValues} = {childValues: () => "some value"}) {
        return Object.fromEntries(Array.from({length: 1000}, (_value, key) => [key, childValues()]));
      }

      // Generate an input object which has 1000 properties.  Each of those properties is another object which itself
      // contains 1000 properties, giving a total of 1,000,000 properties in the entire object tree.
      const input = getObjectWithOneThousandProperties({
        childValues: () => getObjectWithOneThousandProperties()
      });

      const startTime = new Date().valueOf();
      const sanitizedValue = logCleaner.sanitize(input);
      const endTime = new Date().valueOf();

      // At time of writing, the log sanitizer has a time budget of 10 milliseconds.  Check that the amount of time
      // taken is around this range, but allow a bit of extra time in case the host system slows down (for example, due
      // to V8 garbage collection pauses).
      const timeTakenInMs = endTime - startTime;
      assert.ok(timeTakenInMs >= 10 && timeTakenInMs <= 15);

      assert.ok(JSON.stringify(sanitizedValue).includes("[TRUNCATED]"));
    });
  });
});
