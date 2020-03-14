const request = require('request');
const Ravenfall = (function() {
  const self = this;
  self.baseUrl = '';
  self.username = '';
  self.password = '';
  self.clientVersion = '';
  self.accessKey = '';
  self.debug = false;
  self.sessionToken = null;
  self.token = null;
  self.startTime = new Date();
  self.RavenFallItems = [];
  /**
 * Class constructor.
 * @param {ravenfallConfiguration} ravenfallConfiguration ravenfallConfiguration passed to the constructor.
 */
  function Ravenfall(ravenfallConfiguration) {
    self.baseUrl = ravenfallConfiguration.baseUrl;
    self.username = ravenfallConfiguration.username;
    self.password = ravenfallConfiguration.password;
    self.clientVersion = ravenfallConfiguration.clientVersion;
    self.accessKey = ravenfallConfiguration.accessKey;
    self.debug = ravenfallConfiguration.debug;
    self.sessionToken = null;
    self.token = null;
    self.startTime = new Date();
    self.RavenFallItems = [];
    _log('Ravenfall Constructor called and class instantiated');
  }

  /**
 * Logs to console if debug was enabled during config.
 * @param {obj} obj Object to be output to console
 * @param {type} type Type of console message to make: log, info, warn, error
 */
  function _log(obj, type) {
    if (!type) type = 'log';
    if (this.debug) console[type](new Date()-this.startTime, obj);
  }
  Ravenfall.prototype._log = _log;

  /**
 * Authenticates you with your ravenfall username + password against the API and gets a token.
 * @param {username} username Ravenfall username
 * @param {password} password Ravenfall password
 * @return {Promise} Promise with a JWT Token
 */
  function ravenFallAuth(username, password) {
    _log('ravenFallAuth - Start');
    return new Promise(function(resolve, reject) {
      _log('ravenFallAuth - Promise Start');
      request.post({
        url: self.baseUrl + 'auth',
        json: {'username': username, 'password': password},
      }, function(err, res) {
        _log('ravenFallAuth - Response');
        if (err) {
          _log('ravenFallAuth - Reject');
          return reject(err);
        } else {
          _log('ravenFallAuth - Resolve');
          return resolve(res.body);
        }
      });
    });
  }
  Ravenfall.prototype.RavenFallAuth = ravenFallAuth;

  /**
 * Wrapper for ravenFallAuth to handle reuse of the token if it has not expired as well as renewal.
 * @return {Promise} Returns a JWT Promise.
 */
  function getAuthToken() {
    _log('getAuthToken - Start');
    return new Promise(function(resolve, reject) {
      _log('getAuthToken - Promise');
      if (typeof self.token === 'undefined' || self.token === null) {
        _log('getAuthToken - token undef');
        ravenFallAuth(self.username, self.password).then(function(data) {
          self.token = data;
          return resolve(self.token);
        });
      }
      if (typeof self.token !== 'undefined' && self.token !== null) {
        _log('getAuthToken - token not undef');
        if (new Date(self.token.expiresUtc) - new Date() <= 0) {
          _log('getAuthToken - token expired');
          ravenFallAuth(self.username, self.password).then(function(data) {
            self.token = data;
            return resolve(self.token);
          });
        } else {
          _log('getAuthToken - token reused');
          return resolve(self.token);
        }
      }
    });
  }
  Ravenfall.prototype.GetAuthToken = getAuthToken;

  /**
 * tokenizes the JWT received from ravenFallAuth to be used as a Bearer token in header.
 * @param {authResponse} authResponse RavenFall JWT
 * @return {Promise} Returns a promise containing the base64 encoded JWT.
 */
  function tokenize(authResponse) {
    _log('tokenize - Start');
    return new Promise(function(resolve, reject) {
      _log('tokenize - Promise');
      try {
        _log('tokenize - Try');
        const tokenStr = JSON.stringify(authResponse);
        const base64Token = Buffer.from(tokenStr).toString('base64');
        return resolve({token: base64Token});
      } catch (err) {
        _log('tokenize - Catch');
        return reject(authResponse);
      }
    });
  }
  Ravenfall.prototype.Tokenize = tokenize;

  /**
 * Returns a key-value object that represents headers to be sent in the request to the API for
 * authorization and response/content-type
 * @param {authResponse} authResponse Authorization response/JWT
 * @return {Promise} Promise with a JSON object representing authorization headers and content-type
 */
  function setClientHeader(authResponse) {
    _log('setClientHeader - Start');
    return new Promise(function(resolve, reject) {
      _log('setClientHeader - Promise');
      if (!authResponse) {
        return resolve({
          'Content-Type': 'application/json, charset=utf-8',
          'Accept': '*/*',
        });
      } else {
        tokenize(authResponse).then(function(tokenObj) {
          try {
            _log('setClientHeader - Try');
            if (!tokenObj) {
              return resolve({
                'Content-Type': 'application/json, charset=utf-8',
                'Accept': '*/*',
              });
            } else {
              return resolve({
                'Content-Type': 'application/json, charset=utf-8',
                'Accept': '*/*',
                'auth-token': tokenObj.token,
              });
            }
          } catch (err) {
            _log('setClientHeader - Catch');
            return reject(new Error('Missing token in Token response'));
          }
        });
      }
    });
  }
  Ravenfall.prototype.SetClientHeader = setClientHeader;

  /**
 * Get game stats with a valid session. CURRENTLY UNTESTED
 * @return {Promise} Promise with an API response from GET /api/game endpoint
 */
  function GetGameStats() {
    _log('GetGameStats - Start');
    return session('GET', 'game');
  }
  Ravenfall.prototype.GetGameStats = GetGameStats;

  /**
 * Get a valid session token based on the configured clientVersion and accessKey
 * @return {Promise} Promise with a JWT Session Token
 */
  function ravenFallSession() {
    _log('RavenFallSession - Start');
    return new Promise(function(resolve, reject) {
      self.setClientHeader().then(function(header) {
        _log('RavenFallSession - Promise');
        if (!self.clientVersion && !self.accessKey) {
          _log('RavenFallSession - No Conf reject');
          return reject(new Error('You dont have the required configuration for this feature.'));
        }
        _log('RavenFallSession - POST');
        request.post({
          url: self.baseUrl + 'game/'+self.clientVersion+'/'+self.accessKey,
          headers: header,
          json: {'Value': false},
        }, function(err, res) {
          _log('RavenFallSession - Response');
          if (err || res.statusCode !== 200) {
            _log('RavenFallSession - Reject');
            return reject(err || 'Game Session POST ResponseCode: ' + res.statusCode);
          } else {
            _log('RavenFallSession - Resolve');
            return resolve(res.body);
          }
        });
      });
    });
  }
  Ravenfall.prototype.RavenFallSession = ravenFallSession;

  /**
 * Gets/Sets a session token through helper functions for
 * reuse and further request.
 * @return {Promise} Promise with a JWT Token
 */
  function getSessionToken() {
    _log('getSessionToken - Start');
    return new Promise(function(resolve, reject) {
      _log('getSessionToken - Promise');
      if (!self.clientVersion && !self.accessKey) {
        _log('getSessionToken - Reject No Conf');
        return reject(new Error('You dont have the required configuration for this feature.'));
      }
      if (typeof self.sessionToken === 'undefined' || self.sessionToken === null) {
        _log('getSessionToken - session undef');
        self.ravenFallSession().then(function(data) {
          self.sessionToken = data;
          return resolve(data);
        }).catch(function(err) {
          _log(err, 'error');
        });
      }
      if (typeof self.sessionToken !== 'undefined' && self.sessionToken !== null) {
        _log('getSessionToken - session !undef');
        if (new Date(self.sessionToken.expiresUtc) - new Date() <= 0) {
          _log('getSessionToken - session expired');
          self.ravenFallSession().then(function(data) {
            self.sessionToken = data;
            return resolve(data);
          }).catch(self.ErrorHandler);
        } else {
          _log('getSessionToken - session reused');
          return resolve(self.sessionToken);
        }
      }
    });
  }
  Ravenfall.prototype.GetSessionToken = getSessionToken;

  /**
 * Get a paged highscore listing on a specific skill.
 * @param {skill} skill Name or number of skill to check listings for
 * @param {offset} offset What is the page offset
 * @param {skip} skip Skip how many items?
 * @return {Promise} Promise with an API Response
 */
  function GetSkillHighScore1(skill, offset, skip) {
    return api('GET', 'highscore/paged/' + skill +'/'+ offset + '/' + skip);
  }
  Ravenfall.prototype.GetSkillHighScore1 = GetSkillHighScore1;

  /**
 * Get a paged highscore listing.
 * @param {offset} offset What is the page offset
 * @param {skip} skip Skip how many items?
 * @return {Promise} Promise with an API Response
 */
  function GetPagedHighScore(offset, skip) {
    return api('GET', 'highscore/paged/' + offset + '/' + skip);
  }
  Ravenfall.prototype.GetPagedHighScore = GetPagedHighScore;

  /**
 * Get top 100 highscore listing on a specific skill.
 * @param {skill} skill Name or number of skill to check listings for
 * @return {Promise} Promise with an API Response
 */
  function GetSkillHighScore2(skill) {
    return api('GET', 'highscore/' + skill);
  }
  Ravenfall.prototype.GetSkillHighScore2 = GetSkillHighScore2;

  /**
 * Get a general top 100 highscore listing on all skills.
 * @return {Promise} Promise with an API Response
 */
  function GetHighScore() {
    return api('GET', 'highscore');
  }
  Ravenfall.prototype.GetHighScore = GetHighScore;

  /**
 * Get all available items in the game.
 * @return {Promise} Promise with an API Response
 */
  function GetItems() {
    return new Promise(function(resolve, reject) {
      if (self.RavenFallItems.length > 0) return resolve({data: self.RavenFallItems});
      api('GET', 'items').then(function(data) {
        if (typeof data !== 'undefined' && isArray(data)) {
          self.RavenFallItems = data.sort(self.SortByPower);
          return resolve({data: data});
        } else {
          return reject(new Error('Itemdata is undefined or non-array: ' + JSON.stringify(data)));
        }
      }).catch(function(err) {
        return reject(err);
      });
    });
  }
  Ravenfall.prototype.GetItems = GetItems;

  /**
 * Add an item into the game
 * @param {obj} obj Object representing the item to be added to the game.
 * @return {Promise} Promise with an API Response
 */
  function CreateItem(obj) {
    return new Promise(function(resolve, reject) {
      const exampleObj = {
        'id': '00000000-0000-0000-0000-000000000000',
        'name': null,
        'level': 0,
        'weaponAim': 0,
        'weaponPower': 0,
        'armorPower': 0,
        'requiredAttackLevel': 0,
        'requiredDefenseLevel': 0,
        'category': 0,
        'type': 0,
        'material': 0,
        'maleModelId': null,
        'femaleModelId': null,
        'genericPrefab': null,
        'malePrefab': null,
        'femalePrefab': null,
        'isGenericModel': null,
        'craftable': null,
        'requiredCraftingLevel': 0,
        'woodCost': 0,
        'oreCost': 0,
      };
      const compareResult = self.compareProps(obj, exampleObj);
      if ( compareResult.length > 0) {
        return reject(new Error('Missing props: ' + compareResult.join(', ')));
      }
      api('POST', 'items', obj).then(function(data) {
        return resolve(data);
      }).catch(function(err) {
        return reject(err);
      });
    });
  }
  Ravenfall.prototype.CreateItem = CreateItem;

  /**
 * Remove an item from the game.
 * @param {id} id ID of the item to be deleted.
 * @return {Promise} Promise with an API Response
 */
  function DeleteItem(id) {
    return api('DELETE', 'items/' + id.toString());
  }
  Ravenfall.prototype.DeleteItem = DeleteItem;

  /**
 * Get a paged highscore listing on a specific skill.
 * @param {obj} obj Object to be updated
 * @return {Promise} Promise with an API Response
 */
  function UpdateItem(obj) {
    return new Promise(function(resolve, reject) {
      const exampleObj = {
        'id': '00000000-0000-0000-0000-000000000000',
        'name': null,
        'level': 0,
        'weaponAim': 0,
        'weaponPower': 0,
        'armorPower': 0,
        'requiredAttackLevel': 0,
        'requiredDefenseLevel': 0,
        'category': 0,
        'type': 0,
        'material': 0,
        'maleModelId': null,
        'femaleModelId': null,
        'genericPrefab': null,
        'malePrefab': null,
        'femalePrefab': null,
        'isGenericModel': null,
        'craftable': null,
        'requiredCraftingLevel': 0,
        'woodCost': 0,
        'oreCost': 0,
      };
      const compareResult = self.compareProps(obj, exampleObj);
      if ( compareResult.length > 0) {
        return reject(new Error('Missing props: ' + compareResult.join(', ')));
      }
      api('PUT', 'items', obj).then(function(data) {
        return resolve(data);
      }).catch(function(err) {
        return reject(err);
      });
    });
  }
  Ravenfall.prototype.UpdateItem = UpdateItem;

  /**
 * Buy an item from the market with set maxPricePerItem
 * @param {userId} userId userId of the user making the purchase.
 * @param {itemId} itemId itemId of the item the user is purchasing.
 * @param {amount} amount How many items?
 * @param {maxPricePerItem} maxPricePerItem What is the item allowed to cost per item?
 * @return {Promise} Promise with an API Response
 */
  function BuyItem(userId, itemId, amount, maxPricePerItem) {
    return session('GET', 'marketplace/'+userId+'/buy/'+itemId+'/'+amount+'/'+maxPricePerItem);
  }
  Ravenfall.prototype.BuyItem = BuyItem;
  /**
 * Sell an item on the market with set pricePerItem
 * @param {userId} userId userId of the user making the sale.
 * @param {itemId} itemId itemId of the item the user is selling.
 * @param {amount} amount How many items?
 * @param {pricePerItem} pricePerItem What is the cost of the item?
 * @return {Promise} Promise with an API Response
 */
  function SellItem(userId, itemId, amount, pricePerItem) {
    return session('GET', 'marketplace/'+userId+'/sell/'+itemId+'/'+amount+'/'+pricePerItem);
  }
  Ravenfall.prototype.SellItem = SellItem;

  /**
 * List available items on the marketplace with pagination.
 * @param {offset} offset Offset for listing.
 * @param {size} size How many items do you wish to list?
 * @return {Promise} Promise with an API Response
 */
  function GetMarketplaceListing(offset, size) {
    return api('GET', 'marketplace/'+offset+'/'+size);
  }
  Ravenfall.prototype.GetMarketplaceListing = GetMarketplaceListing;

  /**
 * Get currently authenticated user's data from the API
 * @return {Promise} Promise with an API Response
 */
  function GetPlayerData() {
    return api('GET', 'players/user');
  }
  Ravenfall.prototype.GetPlayerData = GetPlayerData;

  /**
 * Add a user to an existing session.
 * @param {userId} userId userId of the user making the purchase.
 * @return {Promise} Promise with an API Response
 */
  function AddPlayerToSession(userId) {
    return session('POST', 'players/user/'+userId, {'Value': ''});
  }
  Ravenfall.prototype.AddPlayerToSession = AddPlayerToSession;

  /**
 * Get player data based on twitchid.
 * @param {userId} userId userId of the user you're requesting information on.
 * @param {localUser} localUser If defined, it assumes it's a local user (i.e. not twitch integrated one)
 * @return {Promise} Promise with an API Response
 */
  function GetPlayerByTwitchId(userId, localUser) {
    if (typeof localUser !== 'undefined' && localUser !== null) {
      _log('Local user:' + userId);
      return session('GET', 'players/'+userId);
    } else {
      _log('not Local user: ' + userId);
      return api('GET', 'players/'+userId);
    }
  }
  Ravenfall.prototype.GetPlayerByTwitchId = GetPlayerByTwitchId;

  /**
 * Add an item to a plaer
 * @param {userId} userId userId of the user receiving the item.
 * @param {itemId} itemId itemId of the item the user is receiving.
 * @return {Promise} Promise with an API Response
 */
  function AddItemToPlayer(userId, itemId) {
    return session('GET', 'players/'+userId+'/item/'+itemId);
  }
  Ravenfall.prototype.AddItemToPlayer = AddItemToPlayer;

  /**
 * Unequip an item from the player
 * @param {userId} userId userId of the user making the action.
 * @param {itemId} itemId itemId of the item the user is performing the action on.
 * @return {Promise} Promise with an API Response
 */
  function UnequipItem(userId, itemId) {
    return session('GET', 'players/'+userId+'/unequip/'+itemId);
  }
  Ravenfall.prototype.UnequipItem = UnequipItem;

  /**
 * Equip an item on the player
 * @param {userId} userId userId of the user making the action.
 * @param {itemId} itemId itemId of the item the user is performing the action on.
 * @return {Promise} Promise with an API Response
 */
  function EquipItem(userId, itemId) {
    return session('GET', 'players/'+userId+'/equip/'+itemId);
  }
  Ravenfall.prototype.EquipItem = EquipItem;

  /**
 * Update appearance on the user associated with the token.
 * @param {arrOfValues} arrOfValues An array of values representing the user appearance data.
 * @return {Promise} Promise with an API Response
 */
  function UpdateAppearance(arrOfValues) {
    return api('POST', 'players/appearance', {Values: arrOfValues});
  }
  Ravenfall.prototype.UpdateAppearance = UpdateAppearance;
  /**
 * Unequip an item frmo the player
 * @param {userId} userId userId of the user making the action.
 * @param {arrOfValues} arrOfValues Array of values representing the appearance of the user.
 * @return {Promise} Promise with an API Response
 */
  function UpdatePlayerAppearance(userId, arrOfValues) {
    return session('POST', 'players/'+userId+'/appearance', {Values: arrOfValues});
  }
  Ravenfall.prototype.UpdatePlayerAppearance = UpdatePlayerAppearance;

  /**
 * Update player experience
 * @param {userId} userId userId of the user making the action.
 * @param {arrOfValues} arrOfValues An array of values representing the new experience levels of the user
 * @return {Promise} Promise with an API Response
 */
  function UpdatePlayerExperience(userId, arrOfValues) {
    return session('POST', 'players/'+userId+'/experience', {Values: arrOfValues});
  }
  Ravenfall.prototype.UpdatePlayerExperience = UpdatePlayerExperience;

  /**
 * Update player statistics
 * @param {userId} userId userId of the user making the action.
 * @param {arrOfValues} arrOfValues Update plaer statistics with an array of values representing a set of specific
 * @return {Promise} Promise with an API Response
 */
  function UpdatePlayerStatistics(userId, arrOfValues) {
    return session('POST', 'players/'+userId+'/statistics', {Values: arrOfValues});
  }
  Ravenfall.prototype.UpdatePlayerStatistics = UpdatePlayerStatistics;
  /**
 * Update player resources
 * @param {userId} userId userId of the user making the action.
 * @param {arrOfValues} arrOfValues Array of values representing resource levels on a user
 * @return {Promise} Promise with an API Response
 */
  function UpdatePlayerResources(userId, arrOfValues) {
    return session('POST', 'players/'+userId+'/resources', {Values: arrOfValues});
  }
  Ravenfall.prototype.UpdatePlayerResources = UpdatePlayerResources;

  /**
 * Gift an item from one player to another
 * @param {userId} userId userId of the user making the action.
 * @param {receiverUserId} receiverUserId receiver userId
 * @param {itemId} itemId itemId of the item the user is performing the action on.
 * @return {Promise} Promise with an API Response
 */
  function GiftItem(userId, receiverUserId, itemId) {
    return session('GET', 'players/'+userId+'/gift/'+receiverUserId+'/'+itemId);
  }
  Ravenfall.prototype.GiftItem = GiftItem;

  /**
 * Update many players with respective data in one go.
 * @param {arrOfUpdates} arrOfUpdates an array of users to update.
 * @return {Promise} Promise with an API Response
 */
  function BulkUpdatePlayers(arrOfUpdates) {
    return new Promise(function(resolve, reject) {
      const exampleObj = {
        'userId': 'example',
        'currentTask': 'example',
        'experience': [],
        'resources': [],
        'statistics': [],
        'revision': 0,
      };
      if (!isArray(arrOfUpdates)) return reject(new Error('provided Object is not an array'));
      if (!allOfType(arrOfUpdates, exampleObj)) {
        return reject(new Error('An item in the provided array does not match schema.'));
      }
      session('POST', 'players/udpate', {Values: arrOfUpdates}).then(function(data) {
        resolve(data);
      }).catch(function(err) {
        reject(err);
      });
    });
  }
  Ravenfall.prototype.BulkUpdatePlayers = BulkUpdatePlayers;

  /**
 * Compares properties between two objects and returns a list of errors if any.
 * @param {compareObj} compareObj the object to be checked
 * @param {compareTo} compareTo the object to be used as reference for checking.
 * @return {Array} An array of missing props.
 */
  function compareProps(compareObj, compareTo) {
    const missingProps = [];
    for (const p in compareTo) {
      if (typeof compareObj[p] === 'undefined' ||
          compareObj[p] === null ||
          !sameType(compareTo[p], compareObj[p])) {
        missingProps.push(p);
      }
    }
    return missingProps;
  }
  Ravenfall.prototype.compareProps = compareProps;

  /**
 * Check that all objects in an array conform to the example object.
 * @param {compareObj} exampleObj The object to compare to
 * @param {arrayObj} arrayObj The object rerepsenting all of item type [type}]
 * @return {Array} An array of missing props.
 */
  function allOfType(exampleObj, arrayObj) {
    let passed = true;
    for (const item in arrayObj) {
      if (typeof arrayObj[item] !== 'undefined') {
        const res = compareProps(arrayObj[item], exampleObj);
        if (res.length > 0) {
          passed = false; break;
        }
      }
    }
    return passed;
  }
  Ravenfall.prototype.allOfType = allOfType;
  /**
 * Checks if the object is an array and returns true if that is so.
 * @param {obj} obj the object to be checked
 * @return {Boolean} A boolean representing if the object is an array object.
 */
  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }
  Ravenfall.prototype.isArray = isArray;

  /**
 * Compares two objects to ensure they are of the same type.
 * @param {obj} obj the object to be checked
 * @param {comparedTo} comparedTo the object to be used as reference for checking.
 * @return {Boolean} A boolean representing the result of the typecheck.
 */
  function sameType(obj, comparedTo) {
    return Object.prototype.toString.call(obj) === Object.prototype.toString.call(comparedTo);
  }
  Ravenfall.prototype.sameType = sameType;

  /**
 * Loops through an array of items that are lacking extended item details.
 * @param {itemArray} itemArray the item array to add properties to.
 * @return {Array} An array of items.
 */
  function EnrichItemData(itemArray) {
    itemArray.forEach(function(item) {
      item = Object.assign(item, self.RavenFallItems.filter(function(ilookup) {
        return ilookup.id === item.itemId;
      })[0]);
    });
    return itemArray;
  }
  Ravenfall.prototype.EnrichItemData = EnrichItemData;
  /**
 * Compares two objects to ensure they are of the same type.
 * @param {playerData} playerData the player object to get their equipment data from
 * @return {Promise} A Promise wrapped string that gives you the current equiped items.
 */
  function HandleEquipmentData(playerData) {
    return new Promise(function(resolve, reject) {
      try {
        const inv = playerData.inventoryItems;
        inv.forEach(function(item) {
          item = Object.assign(item, self.RavenFallItems.filter(function(ilookup) {
            return ilookup.id === item.itemId;
          })[0]);
        });
        const eqItems = inv.filter(function(item) {
          return item.equipped;
        }).sort(SortByPower);
        const tArr=[];
        for (let i=0; i<eqItems.length; i++) {
          const tItem = tArr[eqItems[i].type];
          if (!tItem) tArr[eqItems[i].type] = eqItems[i];
        }
        const cleaned = tArr.filter(function(item) {
          return item;
        }).map(function(item) {
          return item.name;
        });
        resolve(cleaned.join(', '));
      } catch (ex) {
        reject(ex);
      }
    });
  }
  Ravenfall.prototype.HandleEquipmentData = HandleEquipmentData;
  /**
 * A sort function that can be referenced in a sort(SortByPower) type of action.
 * @param {left} left The object to check on the left hand side
 * @param {right} right the object to check on the rigt hand side
 * @return {NUmber} returns a positive, 0 or negative number to represent
 * the result of the check between left and right.
 */
  function SortByPower(left, right) {
    if (left.armorPower > right.armorPower) return -1;
    if (left.armorPower < right.armorPower) return 1;
    if (left.weaponPower > right.weaponPower) return -1;
    if (left.weaponPower < right.weaponPower) return 1;
    return 0;
  }
  Ravenfall.prototype.SortByPower = SortByPower;

  this.MaxLevel = 170;
  this.experienceArray = [
    83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115, 3523, 3973,
    4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456, 18247, 20224, 22406,
    24815, 27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512, 67983, 75127, 83014, 91721, 101333,
    111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466, 247886, 273742, 302288, 333804, 368599,
    407015, 449428, 496254, 547953, 605032, 668051, 737627, 814445, 899257, 992895, 1096278, 1210421, 1336443,
    1475581, 1629200, 1798808, 1986068, 2192818, 2421087, 2673114, 2951373, 3258594, 3597792, 3972294, 4385776,
    4842295, 5346332, 5902831, 6517253, 7195629, 7944614, 8771558, 9684577, 10692629, 11805606, 13034431, 14391160,
  ];
  /**
 * Generates the experience array that the game uses.
 */
  function experienceArray() {
    let l = 0;
    for (let i1 = 0; i1 < self.MaxLevel; i1++) {
      const j1 = i1 + 1;
      const l1 = j1 + (300 * Math.pow(2, j1 / 7));
      l += l1;
      experienceArray[i1] = ((l & 0xffffffffc) / 4);
    }
  }
  experienceArray();
  /**
 * Gets the level the experience provided represents.
 * @param {exp} exp the exp to check
 * @return {Number} A number representing the level.
 */
  function experienceToLevel(exp) {
    for (let level = 0; level < self.MaxLevel - 1; level++) {
      if (exp >= experienceArray[level]) {
        continue;
      }
      return (level + 1);
    }
    return self.MaxLevel;
  }
  Ravenfall.prototype.ExperienceToLevel = experienceToLevel;
  /**
 * Gets the current progress of a skill based on the exp provided.
 * @param {exp} exp the exp to check
 * @return {String} A string representing the progress %.
 */
  function progress(exp) {
    const currLevel = experienceToLevel(exp);
    const levelExp = levelToExperience(currLevel);
    const nextExp = levelToExperience(currLevel+1>self.MaxLevel?self.MaxLevel:currLevel+1);
    return parseFloat((1-((nextExp - exp)/(nextExp-levelExp)))*100).toFixed(0) + '%';
  }
  Ravenfall.prototype.Progress = progress;
  /**
 * Gets the minimum exp required to for a level.
 * @param {level} level the level to check
 * @return {Number} A number representing the level.
 */
  function levelToExperience(level) {
    return level - 2 < 0 ? 0 : experienceArray[level - 2];
  }
  Ravenfall.prototype.LevelToExperience = levelToExperience;
  /**
 * Makes an API call to the Ravenfall API.
 * @param {method} method HTTP Method for the request
 * @param {urlPart} urlPart the urlPath to be appended to the baseApi Url.
 * @param {content} content The Content to send to the API.
 * @return {Promise} A Promise representing the API call result.
 */
  function api(method, urlPart, content) {
    const opt = {
      url: self.baseUrl + urlPart,
      method: method.toUpperCase(),
      json: true,
    };
    if (typeof content !== 'undefined' && content !== null) {
      opt.data = content;
    }
    return new Promise(function(resolve, reject) {
      getAuthToken().then(setClientHeader).then(function(header) {
        opt.headers = header;
        request(opt, function(err, res) {
          if (err || res.statusCode !== 200) return reject(err || res.toJSON);
          else if (typeof res.body === 'undefined' || res.body === null) {
            return reject(new Error('Empty body from API'));
          } else {
            return resolve(res.body);
          }
        });
      });
    });
  }
  Ravenfall.prototype.API = api;

  /**
 * Makes an API call to the Ravenfall API with a session token.
 * @param {method} method HTTP Method for the request
 * @param {urlPart} urlPart the urlPath to be appended to the baseApi Url.
 * @param {content} content The Content to send to the API.
 * @return {Promise} A Promise representing the API call result.
 */
  function session(method, urlPart, content) {
    const opt = {
      url: self.baseUrl + urlPart,
      method: method.toUpperCase(),
      json: true,
    };
    if (typeof content !== 'undefined' && content !== null) {
      opt.data = content;
    }
    return new Promise(function(resolve, reject) {
      getSessionToken().then(setClientHeader).then(function(header) {
        opt.headers = header;
        request(opt, function(err, res) {
          if (err || res.statusCode !== 200) return reject(err || res.toJSON());
          else {
            return resolve(res.body);
          }
        });
      });
    });
  }
  Ravenfall.prototype.Session = session;

  return Ravenfall;
})();

module.exports = { Ravenfall };
