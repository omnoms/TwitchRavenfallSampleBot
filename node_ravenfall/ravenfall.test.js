const {describe} = require('mocha');
const assert = require('assert');
const {expect} = require('chai');
const sinon = require('sinon');
describe('RavenFall UT', function() {
  const config = {
    baseUrl: 'https://www.ravenfall.stream/api/',
    username: 'ravenfallusername',
    password: 'ravenfallpassword',
    debug: false,
    clientVersion: 1,
    accessKey: 'gibberish',
  };
  const Ravenfall = require('./ravenfall');
  const r = new Ravenfall(config);

  it('1000 exp eq Level 9', function() {
    assert(r.ExperienceToLevel(1000) === 9);
  });
  it('1000 exp eq 16% progress', function() {
    assert(r.Progress(1000) === '16%');
  });
  it('1000 exp has 155exp to go', function() {
    assert(r.LevelToExperience(10)-1000 === 155);
  });
  it('SortByPower - weapon power 1,2,3 sorted to 3,2,1', function() {
    const sortedArr = [{weaponPower: 1}, {weaponPower: 2}, {weaponPower: 3}].sort(r.SortByPower);
    assert(sortedArr[0].weaponPower === 3);
  });
  it('SortByPower - armor power 1,2,3 sorted to 3,2,1', function() {
    const sortedArr = [{armorPower: 1}, {armorPower: 2}, {armorPower: 3}].sort(r.SortByPower);
    assert(sortedArr[0].armorPower === 3);
  });
  it('sameType should return true for [] and []', function() {
    assert(r.sameType([], []) === true);
  });
  it('sameType should return false for [] and {}', function() {
    assert(r.sameType([], {}) === false);
  });
  it('isArray should return true for [] and false for {}', function() {
    assert(r.isArray({}) === false);
    assert(r.isArray([]) === true);
  });
  it('allOfType should return true', function() {
    const exampleObj = {id: 1, name: 'asd', test: '123123'};
    const exArr = [exampleObj, exampleObj, exampleObj];
    assert(r.allOfType(exampleObj, exArr) === true);
  });
  it('allOfType should return false', function() {
    const exampleObj = {id: 1, name: 'asd', test: '123123'};
    const badObj = {id: 1, names: 'asd', test: '123123'};
    const exArr = [exampleObj, exampleObj, badObj];
    assert(r.allOfType(exampleObj, exArr) === false);
  });
  it('compareProps should return 0', function() {
    const exampleObj = {id: 1, name: 'asd', test: '123123'};
    expect(r.compareProps(exampleObj, exampleObj).length).to.be.equal(0);
  });
  it('compareProps should return 1', function() {
    const exampleObj = {id: 1, name: 'asd', test: '123123'};
    const badObj = {id: 1, names: 'asd', test: '123123'};
    const result = r.compareProps(badObj, exampleObj);
    expect(result.length).to.be.equal(1);
    expect(result[0]).to.be.equal('name');
  });
  it('Parameterless setClientHeader should standard header', function(next) {
    r.SetClientHeader().then(function(data) {
      expect(data['Content-Type']).to.be.equal('application/json, charset=utf-8');
      next();
    });
  });
  it('ravenFallAuth should return a token', function(next) {
    r.RavenFallAuth(config.username, config.password).then(function(data) {
      expect(data).to.not.be.undefined;
      next();
    }).catch(function(err) {
      expect(err).to.be.undefined;
      next();
    });
  });
  it('getAuthToken uninitiated should return a JWT', function(next) {
    r.GetAuthToken().then(function(data) {
      expect(data).to.not.be.undefined;
      next();
    }).catch(function(err) {
      expect(err).to.be.undefined;
      next();
    });
  });
  it('getAuthToken multiple times should return same valid token', function(done) {
    let firstToken = {};
    r.GetAuthToken().then(function(data) {
      expect(data).to.not.be.undefined;
      firstToken = data;
      r.GetAuthToken().then(function(data2) {
        expect(data2).to.not.be.undefined;
        expect(r.compareProps(firstToken, data2).length).to.be.equal(0);
        expect(firstToken.token).to.be.equal(data2.token);
        done();
      }).catch(function(err) {
        expect(err).to.be.undefined;
        done();
      });
    }).catch(function(err) {
      expect(err).to.be.undefined;
      done();
    });
  });
  it('GetItems should store available items from API to class', function(done) {
    r.GetItems().then(function(data) {
      expect(data).to.not.be.undefined;
      expect(data.data).to.not.be.undefined;
      expect(r.isArray(data.data)).to.be.true;
      done();
    }).catch(function(err) {
      expect(err).to.be.undefined;
      done();
    });
  });
});
