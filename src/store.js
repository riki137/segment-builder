import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import createLogger from 'vuex/dist/logger';
import uuid from 'uuid/v1';
import * as fromConfig from './config';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    notification: {
      timeout: 5000,
      color: 'green',
      mode: '',
      y: 'bottom',
      x: 'right',
      show: false,
      text: 'Success',
      closeColor: 'white',
      closeText: 'Close'
    },
    ajaxLoader: false,
    totalCount: 0,
    criteriaCounts: {},
    tablesBlueprint: [],
    selectedTable: null,
    selectedFields: [],
    selectedCriterias: [],
    selectedParameters: []
  },
  getters: {
    tableNames: state => {
      return state.tablesBlueprint.map(item => item.table);
    },
    selectedTable: state => {
      return state.tablesBlueprint.find(
        item => item.table === state.selectedTable
      );
    },
    fieldsForSelectedTable: (state, getters) => {
      return getters.selectedTable ? getters.selectedTable.fields : [];
    },
    criteriasForSelectedTable: (state, getters) => {
      return getters.selectedTable ? getters.selectedTable.criteria : [];
    },
    parametersForSelectedCriteria: (state, getters) => criteriaId => {
      return state.selectedParameters.filter(
        parameter => parameter.criteriaId === criteriaId
      );
    },
    allParametersForCriteriaType: (state, getters) => criteriaType => {
      return getters.criteriasForSelectedTable.find(
        criteria => criteria.key === criteriaType
      ).params;
    },
    criteriaTypeById: (state, getters) => id => {
      return state.selectedCriterias.find(criteria => criteria.id === id).type;
    },
    unusedParametersForCriteria: (state, getters) => criteria => {
      const allParametersForCriteriaType = getters.allParametersForCriteriaType(
        criteria.type
      );
      const alreadySelectedParameters = getters.parametersForSelectedCriteria(
        criteria.id
      );

      const unusedParameters = [];

      for (const [key, value] of Object.entries(allParametersForCriteriaType)) {
        if (
          !alreadySelectedParameters.some(parameter => parameter.name === key)
        ) {
          unusedParameters.push({
            name: key,
            ...value
          });
        }
      }

      return unusedParameters;
    },
    parameterValueById: (state, getters) => parameterId => {
      return state.selectedParameters.find(
        parameter => parameter.id === parameterId
      ).value;
    },
    builtWholeSegmentForApi: (state, getters) => {
      // TODO:
    },
    builtSingleCriteriaForApiCount: (state, getters) => criteriaId => {
      const key = getters.criteriaTypeById(criteriaId);
      const values = {};
      getters.parametersForSelectedCriteria(criteriaId).forEach(parameter => {
        if (parameter.value == undefined) return;
        if (Array.isArray(parameter.value) && parameter.value.length === 0)
          return;

        values[parameter.name] = parameter.value;
      });
      const nodes = [{ type: 'criteria', key, values }];

      if (Object.keys(values).length === 0) return false;

      return {
        version: '1',
        nodes: [
          {
            type: 'operator',
            operator: 'AND',
            nodes
          }
        ]
      };
    }
  },
  mutations: {
    notification(state, payload) {
      state.notification = { ...state.notification, ...payload };
    },
    setTablesBlueprint(state, payload) {
      state.tablesBlueprint = payload;
    },
    setSelectedTable(state, selectedTable) {
      state.selectedTable = selectedTable;
      state.selectedFields = [];
      state.selectedCriterias = [];
      state.selectedParameters = [];
    },
    setSelectedFields(state, selectedFields) {
      state.selectedFields = selectedFields;
    },
    addCriteria(state) {
      state.selectedCriterias.push({ id: uuid() });
    },
    removeCriteria(state, criteriaId) {
      state.selectedCriterias = state.selectedCriterias.filter(
        criteria => criteria.id != criteriaId
      );
      state.selectedParameters = [
        ...state.selectedParameters.filter(
          parameter => parameter.criteriaId !== criteriaId
        )
      ];
    },
    setCriteriaType(state, { id, type }) {
      state.selectedCriterias = state.selectedCriterias.map(criteria => {
        if (criteria.id == id) {
          return { ...criteria, type };
        }
        return criteria;
      });
    },
    setCriteriaCount(state, { criteriaId, count }) {
      state.criteriaCounts = { ...state.criteriaCounts, [criteriaId]: count };
    },
    addParameterToCriteria(state, { criteriaId, parameter }) {
      state.selectedParameters.push({ id: uuid(), criteriaId, ...parameter });
    },
    removeParameter(state, parameterId) {
      state.selectedParameters = state.selectedParameters.filter(
        parameter => parameter.id != parameterId
      );
    },
    setRequiredParametersForCriteria(state, payload) {
      const parametersForCriteria = state.tablesBlueprint
        .find(table => table.table === state.selectedTable)
        .criteria.find(criteria => criteria.key === payload.type).params;
      for (const [key, value] of Object.entries(parametersForCriteria)) {
        if (value.required) {
          state.selectedParameters.push({
            id: uuid(),
            criteriaId: payload.id,
            name: key,
            ...value
          });
        }
      }
    },
    removeParametersForCriteria(state, criteriaId) {
      state.selectedParameters = [
        ...state.selectedParameters.filter(
          parameter => parameter.criteriaId !== criteriaId
        )
      ];
    },
    setParameterValue(state, { parameterId, parameterValue }) {
      state.selectedParameters = state.selectedParameters.map(parameter => {
        if (parameter.id === parameterId) {
          return { ...parameter, value: parameterValue };
        }
        return parameter;
      });
    },
    setAjaxLoader(state, value) {
      state.ajaxLoader = value;
    },
    setTotalCount(state, value) {
      state.totalCount = value;
    }
  },
  actions: {
    fetchTablesBlueprint(context) {
      axios
        .get(fromConfig.URL_TABLES_BLUEPRINT)
        .then(({ data }) => {
          context.commit('setTablesBlueprint', data.blueprint);
        })
        .catch(error => {
          context.commit('notification', {
            show: true,
            color: 'red',
            text: 'Error fetching blueprint'
          });
        });
    },
    fetchCounterAllTotal(context) {
      // TODO: api is currently not supporting empty array, so we are using this workaround
      const data = {
        version: '1',
        nodes: [
          {
            type: 'operator',
            operator: 'OR',
            nodes: [
              {
                type: 'criteria',
                key: 'active',
                values: {
                  active: false
                }
              },
              {
                type: 'criteria',
                key: 'active',
                values: {
                  active: true
                }
              }
            ]
          }
        ]
      };
      axios
        .post(
          `${fromConfig.URL_COUNTER}?table_name=${context.state.selectedTable}`,
          data
        )
        .then(({ data }) => {
          context.commit('setTotalCount', data.count);
        })
        .catch(error => {
          context.commit('notification', {
            show: true,
            color: 'red',
            text: 'Error fetching total count'
          });
        });
    },
    fetchCounterForSingleCriteriaPayload(context, { data, criteriaId }) {
      axios
        .post(
          `${fromConfig.URL_COUNTER}?table_name=${context.state.selectedTable}`,
          data
        )
        .then(({ data }) => {
          context.commit('setCriteriaCount', { criteriaId, count: data.count });
        })
        .catch(error => {
          context.commit('notification', {
            show: true,
            color: 'red',
            text: 'Error counting segment'
          });
          context.commit('setCriteriaCount', { criteriaId, count: false });
        });
    },
    setCriteriaType(context, payload) {
      context.commit('setCriteriaType', payload);
      context.commit('removeParametersForCriteria', payload.id);
      context.commit('setRequiredParametersForCriteria', payload);
    }
  },
  plugins: [createLogger()]
});
