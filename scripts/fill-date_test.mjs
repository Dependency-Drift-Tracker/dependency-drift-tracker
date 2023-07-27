import {expect} from 'chai';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fillMissingDates, loadHistory, loadHistoryFiles} from './fill-date.mjs';

describe('fill date', function () {
  describe('#fillMissingDates', function () {
    it('fill history dates', function () {
      const data = [{}, {}, {date: "2023-07-27T07:10:44.745Z"}];
      const expectedData = [{date: '2023-07-25T07:10:44.745Z'}, {date: '2023-07-26T07:10:44.745Z'}, {date: '2023-07-27T07:10:44.745Z'}];

      const res = fillMissingDates(data);

      expect(res).to.deep.equal(expectedData);
    });

    it('fill history dates between 2 months', function () {
      const data = [{}, {date: "2023-07-01T07:10:44.745Z"}];
      const expectedData = [{date: '2023-06-30T07:10:44.745Z'}, {date: '2023-07-01T07:10:44.745Z'}];

      const res = fillMissingDates(data);

      expect(res).to.deep.equal(expectedData);
    });
  });

  describe('#loadHistory', function () {
    it('should load json into an array', async function () {
      const filePath = './sample/history-a.json';

      const res = await loadHistory(filePath);

      expect(res).to.be.an('array');
      const expectedArray = [{"drift": 1.1225188227241616, "pulse": 1.023956194387406}, {
        "drift": 1.1225188227241616,
        "pulse": 1.0431211498973305
      }, {"drift": 1.1225188227241616, "pulse": 1.0732375085557837}, {
        "drift": 1.1389459274469542,
        "pulse": 1.0869267624914443
      }, {"drift": 1.1690622861054074, "pulse": 1.0951403148528405}, {
        "drift": 1.1772758384668036,
        "pulse": 1.1088295687885013
      }, {"drift": 1.1772758384668036, "pulse": 1.1389459274469542, "date": "2023-07-27T07:10:37.371Z"}];
      expect(res).to.deep.equal(expectedArray);
    });
  });


  describe('loadHistoryFiles', () => {
    it('should load history json files into an array', async () => {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const folderPath = join(__dirname, './sample');
      const filePath = join(__dirname, './sample/history-a.json');
      const content = await loadHistory(filePath);

      const res = await loadHistoryFiles(folderPath);

      const expectedArray = [{filePath, content}];
      expect(res).to.deep.equal(expectedArray);
    });
  });

});
