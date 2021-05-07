"use strict";

describe("logCleaner", (done) => {

  const logCleaner = require("../src/log-cleaner");
  const expect = require("chai").expect
  let testString = "";
  let testArgs;

  describe("cleanUrlRawParameters::cleanUrlRawParameter", (done) => {

    beforeEach(() => {
      testString = '[btrz-vue-websales-res] serverId="localhost" remoteaddr="::ffff:127.0.0.1" xapikey="-" responsetime=688.9 date="2019-02-25T13:55:50.468Z" traceId="-" method=POST url="/cart/4f74a235b0dffc0210000015/cart?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041:1&hasAirlines=false&hasSeatmaps=false&passengers[0][fareId]=4f74b718b0dffc0210000041&passengers[0][fare]=Adults&passengers[0][ssrs]=&passengers[0][firstName]=John,%20Jr.&passengers[0][lastName]=Mc%27%20Snow&passengers[0][email]=johnSnow@winterfell.com&=on" http=1.1 status=302 responselength=164 referrer="http://localhost:8000/cart/4f74a235b0dffc0210000015/reservation/4fba465b0164ad3a55000003/passengers?productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway&channel=websales&departureDate=2019-02-28&from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009&fares=4f74b718b0dffc0210000041%3A1&hasAirlines=false&hasSeatmaps=false&departureTrip=eyJhY2NvdW50SWQiOiI0Zjc0YTIzNWIwZGZmYzAyMTAwMDAwMTUiLCJwcm9kdWN0SWQiOiI0ZmJhNDY1YjAxNjRhZDNhNTUwMDAwMDMiLCJvcmlnaW5JZCI6IjUxZWQyYWU3Y2YyYzgxOWQ1ZTAwMDAwMyIsImRlc3RpbmF0aW9uSWQiOiI1MWVkMmIwOGNmMmM4MTlkNWUwMDAwMDkiLCJmYXJlSWRzIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxOjEiLCJkZXBhcnR1cmVEYXRlIjoiMjAxOS0wMi0yOCIsImRlcGFydHVyZVRpbWUiOiIwMDoyMCIsInRyaXBEaXJlY3Rpb24iOiJvdXRib3VuZCIsImNoYW5uZWwiOiJ3ZWJzYWxlcyIsInNlZ21lbnRzIjpbeyJyb3V0ZUlkIjoiNTFlZDJiZTNjZjJjODE5ZDVlMDAwMDEwIiwic2NoZWR1bGVJZCI6Ik1vcm5pbmciLCJvcmlnaW4iOiJCZWxsdmlldyIsImRlc3RpbmF0aW9uIjoiQmVuZCJ9XSwiZmFyZXMiOlt7ImlkIjoiNGY3NGI3MThiMGRmZmMwMjEwMDAwMDQxIiwidmFsdWUiOjUyNDcwMDB9XSwiZmFyZUNsYXNzZXMiOltdLCJ0aWNrZXRUeXBlIjoib25ld2F5In0&passengers%5B0%5D%5BfareId%5D=4f74b718b0dffc0210000041&passengers%5B0%5D%5Bfare%5D=Adults&passengers%5B0%5D%5Bssrs%5D=&passengers%5B0%5D%5BfirstName%5D=John%2C%20Jr.&passengers%5B0%5D%5BlastName%5D=Mc%27%20Snow&passengers%5B0%5D%5Bemail%5D=johnSnow%40winterfell.com&=on" useragent="Mozilla/5.0 (X11; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0"';
    });
    
    it("should keep the product information", (done) => {
      let cleanBuffer = logCleaner.cleanUrlRawParameters(testString);
      expect(cleanBuffer).to.include("productFamily=reservation&productId=4fba465b0164ad3a55000003&type=oneway");
      done();
    });

    it("should remain the form and to information", (done) => {
      let cleanBuffer = logCleaner.cleanUrlRawParameters(testString);
      expect(cleanBuffer).to.include("from=51ed2ae7cf2c819d5e000003&to=51ed2b08cf2c819d5e000009");
      done();
    });

    it("should remove the first name on a given buffer", (done) => {
      let cleanBuffer = logCleaner.cleanUrlRawParameters(testString);
      expect(cleanBuffer).to.not.include("John");
      expect(cleanBuffer).to.not.include("John, Jr.");
      expect(cleanBuffer).to.not.include("John,%20Jr.");
      done();
    });

    it("should remove the last name on a given buffer", (done) => {
      let cleanBuffer = logCleaner.cleanUrlRawParameters(testString);
      expect(cleanBuffer).to.not.include("Snow");
      expect(cleanBuffer).to.not.include("Mc'");
      expect(cleanBuffer).to.not.include("Mc' Snow");
      expect(cleanBuffer).to.not.include("Mc%27%20Snow");
      done();
    });

    it("should remove the email information on a given buffer", (done) => {
      let cleanBuffer = logCleaner.cleanUrlRawParameters(testString);
      expect(cleanBuffer).to.not.include("johnSnow");
      expect(cleanBuffer).to.not.include("winterfell");
      expect(cleanBuffer).to.not.include("johnSnow@winterfell.com");
      expect(cleanBuffer).to.not.include("johnSnow%40winterfell.com");
      done();
    });
  });

  describe("cleanArgs::clean_credit cards and emails", (done) => {
    it("should remove the (Visa credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "4111111111111111"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.not.include("4111111111111111");
      expect(cleanBuffer[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (MasterCard credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "2720111111111111"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.not.include("2720111111111111");
      expect(cleanBuffer[0]).to.include("regx.ccnumber.replaced");
      done();
    });
    
    it("should remove the (Amex credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "342011111111111"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.not.include("342011111111111");
      expect(cleanBuffer[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (Discover credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "6552011111111111"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.not.include("6552011111111111");
      expect(cleanBuffer[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should remove the (JCB credit card) on a given buffer", (done) => {
      testArgs = [`"ccnumber": "3512131415161718"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.not.include("3512131415161718");
      expect(cleanBuffer[0]).to.include("regx.ccnumber.replaced");
      done();
    });

    it("should not remove a number on a given buffer if it does not match a known cc format", (done) => {
      testArgs = [`"ccnumber": "8111111111111111"`];
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer[0]).to.include("8111111111111111");
      expect(cleanBuffer[0]).to.not.include("regx.ccnumber.replaced");
      done();
    });

    it("should do nothing if args is not not an array (should always be an array)", (done) => {
      testArgs = `"ccnumber": "8111111111111111"`;
      let cleanBuffer = logCleaner.cleanArgs(testArgs);
      expect(cleanBuffer).to.include("8111111111111111");
      expect(cleanBuffer).to.not.include("regx.ccnumber.replaced");
      done();
    });          
  });
});
