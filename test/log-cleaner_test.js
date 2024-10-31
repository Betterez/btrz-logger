const axios = require("axios");
const {AxiosError} = require("axios");
const {expect} = require("chai");
const logCleaner = require("../src/log-cleaner");
const _ = require("lodash");

describe("logCleaner", (done) => {
  let testString = "";
  let testArgs;

  describe("sanitizeUrlRawParameters::cleanUrlRawParameter", () => {
    beforeEach(() => {
      testString = '[btrz-vue-websales-res] serverId="localhost" remoteaddr="::ffff:127.0.0.1" xapikey="-" responsetime=688.9 date="2019-02-25T13:55:50.468Z" traceId="-" method=POST url="/cart/4f74a235b0dffc0210000015/cart?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041:1&hasAirlines=false&hasSeatmaps=false&passengers[0][fareId]=4f74b718b0dffc0210000041&passengers[0][fare]=Adults&passengers[0][ssrs]=&passengers[0][firstName]=John,%20Jr.&passengers[0][lastName]=Mc%27%20Snow&passengers[0][email]=johnSnow@winterfell.com&=on" http=1.1 status=302 responselength=164 referrer="http://localhost:8000/cart/4f74a235b0dffc0210000015/reservation/4fba465b0164ad3a55000003/passengers?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041%3A1&hasAirlines=false&hasSeatmaps=false&departureTrip=eyJhY2NvdW50SWQiOiI0Zjc0YTIzNWIwZGZmYzAyMTAwMDAwMTUiLCJwcm9kdWN0SWQiOiI0ZmJhNDY1YjAxNjRhZDNhNTUwMDAwMDMiLCJvcmlnaW5JZCI6IjUxZWQyYWU3Y2YyYzgxOWQ1ZTAwMDAwMyIsImRlc3RpbmF0aW9uSWQiOiI1MWVkMmIwOGNmMmM4MTlkNWUwMDAwMDkiLCJmYXJlSWRzIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxOjEiLCJkZXBhcnR1cmVEYXRlIjoiMjAxOS0wMi0yOCIsImRlcGFydHVyZVRpbWUiOiIwMDoyMCIsInRyaXBEaXJlY3Rpb24iOiJvdXRib3VuZCIsImNoYW5uZWwiOiJ3ZWJzYWxlcyIsInNlZ21lbnRzIjpbeyJyb3V0ZUlkIjoiNTFlZDJiZTNjZjJjODE5ZDVlMDAwMDEwIiwic2NoZWR1bGVJZCI6Ik1vcm5pbmciLCJvcmlnaW4iOiJCZWxsdmlldyIsImRlc3RpbmF0aW9uIjoiQmVuZCJ9XSwiZmFyZXMiOlt7ImlkIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxIiwidmFsdWUiOjUyNDcwMDB9XSwiZmFyZUNsYXNzZXMiOltdLCJ0aWNrZXRUeXBlIjoib25ld2F5In0&passengers%5B0%5D%5BfareId%5D=4f74b718b0dffc0210000041&passengers%5B0%5D%5Bfare%5D=Adults&passengers%5B0%5D%5Bssrs%5D=&passengers%5B0%5D%5BfirstName%5D=John%2C%20Jr.&passengers%5B0%5D%5BlastName%5D=Mc%27%20Snow&passengers%5B0%5D%5Bemail%5D=johnSnow%40winterfell.com&=on" useragent="Mozilla/5.0 (X11; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0"';
    });

    it("should keep the product information", (done) => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      expect(sanitizedValue).to.include("productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway");
      done();
    });

    it("should remain the form and to information", (done) => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      expect(sanitizedValue).to.include("from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009");
      done();
    });

    it("should remove the first name on a given buffer", (done) => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      expect(sanitizedValue).to.not.include("John");
      expect(sanitizedValue).to.not.include("John, Jr.");
      expect(sanitizedValue).to.not.include("John,%20Jr.");
      done();
    });

    it("should remove the last name on a given buffer", (done) => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      expect(sanitizedValue).to.not.include("Snow");
      expect(sanitizedValue).to.not.include("Mc'");
      expect(sanitizedValue).to.not.include("Mc' Snow");
      expect(sanitizedValue).to.not.include("Mc%27%20Snow");
      done();
    });

    it("should remove the email information on a given buffer", (done) => {
      let sanitizedValue = logCleaner.sanitizeUrlRawParameters(testString);
      expect(sanitizedValue).to.not.include("johnSnow");
      expect(sanitizedValue).to.not.include("winterfell");
      expect(sanitizedValue).to.not.include("johnSnow@winterfell.com");
      expect(sanitizedValue).to.not.include("johnSnow%40winterfell.com");
      done();
    });
  });

  describe("sanitize::clean_credit cards, request and emails", (done) => {
    it("should remove the (Visa credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "4111111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.not.include("4111111111111111");
      expect(sanitizedValue[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (MasterCard credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "2720111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.not.include("2720111111111111");
      expect(sanitizedValue[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (Amex credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "342011111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.not.include("342011111111111");
      expect(sanitizedValue[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (Discover credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "6552011111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.not.include("6552011111111111");
      expect(sanitizedValue[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (JCB credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "3512131415161718"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.not.include("3512131415161718");
      expect(sanitizedValue[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should not modify its input when the input is an array", () => {
      testArgs = [`"ccnumber": "3512131415161718"`];
      const sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue).not.to.eql([`"ccnumber": "3512131415161718"`]);
      expect(testArgs).to.eql([`"ccnumber": "3512131415161718"`]);
    });

    it("should not remove a number on a given buffer if it does not match a known cc format", (done) => {
      testArgs = [`"ccnumber": "8111111111111111"`];
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue[0]).to.include("8111111111111111");
      expect(sanitizedValue[0]).to.not.include("regx.ccnumber.replaced");
      done();
    });

    it("should do nothing if args is not not an array (should always be an array)", (done) => {
      testArgs = `"ccnumber": "8111111111111111"`;
      let sanitizedValue = logCleaner.sanitize(testArgs);
      expect(sanitizedValue).to.include("8111111111111111");
      expect(sanitizedValue).to.not.include("regx.ccnumber.replaced");
      done();
    });

    it("should work fine and log an Error object", () => {
      const sanitizedValue = logCleaner.sanitize([new Error("THIS_ERROR")]);
      expect(sanitizedValue[0].message).to.include("THIS_ERROR");
    });

    it("should remove flagged fields in objects", () => {
      const objArg = {
        result: 'valid',
        reason: 'accepted_email',
        disposable: 'false',
        accept_all: 'false',
        role: 'false',
        free: 'true',
        email: 'some-user@betterez.com',
        user: 'some-user',
        domain: 'betterez.com',
        mx_record: 'gmail-smtp-in.l.google.com',
        mx_domain: 'google.com',
        safe_to_send: 'true',
        did_you_mean: 'another-user',
        success: 'true',
        message: ''
      };
      let sanitizedValue = logCleaner.sanitize([objArg]);
      expect(Object.keys(sanitizedValue[0])).to.be.same.length(Object.keys(objArg).length)
      expect(sanitizedValue[0].email).to.eql("***");
      expect(sanitizedValue[0].user).to.eql("***");
      expect(sanitizedValue[0].did_you_mean).to.eql("***");
    });

    it("should not modify its input when the input contains an object", () => {
      const objArg = {
        email: "some-user@betterez.com",
        nestedObject: {
          password: "some-password",
        }
      };
      const sanitizedValue = logCleaner.sanitize([objArg]);
      expect(sanitizedValue).not.to.eql([{
        email: "some-user@betterez.com",
        nestedObject: {
          password: "some-password",
        }
      }]);
      expect(objArg).to.eql({
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
      expect(Object.keys(sanitizedValue[0])).to.be.same.length(Object.keys(objArg).length)
      expect(sanitizedValue[0].result.info.email).to.eql("***");
      expect(sanitizedValue[0].result.info.user).to.eql("***");
      expect(sanitizedValue[0].result.info.password).to.eql("***");
    })

    it("should remove emails in JSON.stringify strings inside objects", () => {
      const objArg = {
        status: "ok",
        result: {
          raw: 1,
          info: `{"info":{"user":"admin","email":"some-admin@betterez.com"}}`
        }
      };
      let sanitizedValue = logCleaner.sanitize([objArg]);
      expect(Object.keys(sanitizedValue[0])).to.be.same.length(Object.keys(objArg).length)
      expect(sanitizedValue[0].result.info).to.not.include("some-admin@betterez.com");
    })

    it("should simplify AxiosErrors and not return sensitive headers", async () => {
      try {
        // This will fail with a 400 Unauthorized response.
        const request = await axios.request({
          method: "POST",
          baseURL: "https://sandbox-api.betterez.com",
          url: "/sales",
          params: {
            test1: 123
          }
        });
      } catch (error) {
        let sanitizedValue = logCleaner.sanitize([error]);
        expect(sanitizedValue[0]).to.eql("[ERR_BAD_REQUEST] Request failed with status 401: [POST] https://sandbox-api.betterez.com/sales\nUnauthorized");
      }
    });

    it("should correctly sanitize an AxiosError which resulted from a request which had no 'baseURL'", async () => {
      try {
        // This will fail with a 400 Unauthorized response.
        await axios.request({
          method: "POST",
          url: "https://sandbox-api.betterez.com/sales",
          params: {
            test1: 123
          }
        });
      } catch (error) {
        let sanitizedValue = logCleaner.sanitize([error]);
        expect(sanitizedValue[0]).to.eql("[ERR_BAD_REQUEST] Request failed with status 401: [POST] https://sandbox-api.betterez.com/sales\nUnauthorized");
        return;
      }

      expect.fail("The API call above should have failed.");
    });

    it("should not mutate its input when the input contains an AxiosError", async () => {
      const error = new AxiosError();
      error.code = "ERR_BAD_REQUEST";
      error.config = {
        method: "GET",
        baseURL: "https://sandbox-api.betterez.com",
        url: "/sales"
      };
      error.response = {
        status: 400,
        data: {
          password: "some-password",
        }
      };

      const sanitizedValue = logCleaner.sanitize(error);
      expect(sanitizedValue).to.eql(
        `[ERR_BAD_REQUEST] Request failed with status 400: [GET] https://sandbox-api.betterez.com/sales\n{"password":"***"}`
      );
      expect(error.response).to.eql({
        status: 400,
        data: {
          password: "some-password",
        }
      });
    });

    it("should not throw an error when sanitizing input which is 'null'", () => {
      expect(logCleaner.sanitize(null)).to.eql(null);
    });

    it("should not throw an error when sanitizing input which is 'undefined'", () => {
      expect(logCleaner.sanitize(undefined)).to.eql(undefined);
    });

    it("should protect against people logging ridiculously large objects (such as the Express 'req' or 'res' objects) by limiting the amount of time that can be spent on sanitization, and truncating the sanitized value if the process takes too long", () => {
      // If a developer accidentally tries to log the Express 'req' or 'res' objects, it will take multiple seconds for
      // the sanitization routine to traverse these objects, since they are very large and may also contain
      // circular references.  As a last resort to prevent this situation from taking down a server, we limit the
      // amount of time that the sanitizer is allowed to spend traversing the input, and then truncate the result if
      // the time budget is exceeded.

      function getObjectWithOneThousandProperties({childValues} = {childValues: () => "some value"}) {
        return Object.fromEntries(
          _.range(1000).map((key) => {
            return [key, childValues()]
          })
        );
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
      expect(timeTakenInMs).to.be.within(10, 15);

      expect(JSON.stringify(sanitizedValue)).to.contain("[TRUNCATED]");
    });
  });
});
