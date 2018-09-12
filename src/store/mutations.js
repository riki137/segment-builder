import uuid from 'uuid/v1';

export default {
  notification(state, payload) {
    state.notification = { ...state.notification, ...payload };
  },
  setTablesBlueprint(state, payload) {
    state.tablesBlueprint = payload;
  },
  setSegmentCategories(state, payload) {
    state.segmentCategories = payload;
  },
  setSegmentName(state, payload) {
    state.segmentName = payload;
  },
  setSegmentCategoryID(state, payload) {
    state.segmentCategoryID = payload;
  },
  setSelectedTable(state, selectedTable) {
    state.selectedTable = selectedTable;
    state.selectedFields = [];
    state.selectedCriterias = [];
    state.selectedParameters = [];
    state.suggestedSegments = [];
  },
  setSelectedFields(state, selectedFields) {
    state.selectedFields = selectedFields;
  },
  addEmptyCriteria(state) {
    state.selectedCriterias.push({ id: uuid() });
  },
  addCriteria(state, { id, type, negation }) {
    state.selectedCriterias.push({ id, type, negation });
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
  setCriteriaCountsLoading(state, criteriaId) {
    state.criteriaCountsLoading.push(criteriaId);
  },
  unsetCriteriaCountsLoading(state, { criteriaId }) {
    state.criteriaCountsLoading = state.criteriaCountsLoading.filter(
      criteria => criteria.id !== criteriaId
    );
  },
  setCriteriaNegation(state, { id, negation }) {
    state.selectedCriterias = state.selectedCriterias.map(criteria => {
      if (criteria.id == id) {
        return { ...criteria, negation };
      }
      return criteria;
    });
  },
  setSegmentCount(state, { count }) {
    state.segmentCount = count;
  },
  setSegmentCountLoading(state, loading) {
    state.segmentCountLoading = loading;
  },
  addParameterToCriteria(state, { criteriaId, parameter }) {
    state.selectedParameters.push({ id: uuid(), criteriaId, ...parameter });
  },
  removeParameter(state, parameterId) {
    const criteriaId = state.selectedParameters.find(
      parameter => parameter.id === parameterId
    ).criteriaId;
    let criteriaParametersCount = 0;

    state.selectedParameters = state.selectedParameters.filter(parameter => {
      if (parameter.criteriaId === criteriaId) {
        criteriaParametersCount++;
      }

      return parameter.id != parameterId;
    });

    if (criteriaParametersCount <= 1) {
      state.selectedCriterias = state.selectedCriterias.filter(
        criteria => criteria.id != criteriaId
      );
    }
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
  },
  setSuggestedSegments(state, { suggestions }) {
    state.suggestedSegments = suggestions;
  },
  setSuggestedSegmentsLoading(state, loading) {
    state.suggestedSegmentsLoading = loading;
  },
  setSavingSegmentLoading(state, loading) {
    state.savingSegmentLoading = loading;
  }
};
