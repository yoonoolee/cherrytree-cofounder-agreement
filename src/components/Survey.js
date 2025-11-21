import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { SECTIONS } from './surveyConstants';
import Section1Formation from './Section1Formation';
import Section2Cofounders from './Section2Cofounders';
import Section3EquityAllocation from './Section3EquityAllocation';
import Section4DecisionMaking from './Section4DecisionMaking';
import Section5EquityVesting from './Section5EquityVesting';
import Section6IP from './Section6IP';
import Section7Compensation from './Section7Compensation';
import Section8Performance from './Section8Performance';
import Section9NonCompete from './Section9NonCompete';
import Section10Final from './Section10Final';
import CollaboratorManager from './CollaboratorManager';
import SurveyNavigation from './SurveyNavigation';

const libraries = ['places'];

function Survey({ projectId, allProjects = [], onProjectSwitch, onPreview, onCreateProject }) {
  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [project, setProject] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const section3Ref = useRef(null);
  const [formData, setFormData] = useState({
    // Section 1: Formation & Purpose
    companyName: '',
    entityType: '',
    entityTypeOther: '',
    registeredState: '',
    mailingStreet: '',
    mailingStreet2: '',
    mailingCity: '',
    mailingState: '',
    mailingZip: '',
    fullMailingAddress: '',
    companyDescription: '',
    industries: [],
    industryOther: '',

    // Section 2: Cofounder Info
    cofounderCount: '',
    cofounders: [],

    // Section 3: Equity Allocation
    finalEquityPercentages: {},
    acknowledgeEquityAllocation: {},
    equityCalculatorDraft: {}, // Individual private drafts per user
    equityCalculatorSubmitted: {}, // Public submitted versions per user

    // Section 4: Decision-Making & Voting
    majorDecisions: [],
    majorDecisionsOther: '',
    equityVotingPower: '',
    finalSayPerson: '',
    tieResolution: '',
    tieResolutionOther: '',
    acknowledgeTieResolution: {},
    includeShotgunClause: '',
    acknowledgeShotgunClause: {},

    // Section 5: Equity & Vesting
    vestingStartDate: '',
    vestingSchedule: '',
    vestingScheduleOther: '',
    cliffPercentage: '',
    accelerationTrigger: '',
    sharesSellNoticeDays: '',
    sharesBuybackDays: '',
    acknowledgeForfeiture: false,
    vestedSharesDisposal: '',

    // Section 6: IP & Ownership
    hasPreExistingIP: '',
    acknowledgeIPAssignment: false,
    acknowledgeIPOwnership: false,

    // Section 7: Compensation & Expenses
    takingCompensation: '',
    compensations: [],
    spendingLimit: '',

    // Section 8: Performance (Cofounder Performance & Departure)
    performanceConsequences: [],
    remedyPeriodDays: '',
    terminationWithCause: [],
    terminationWithCauseOther: '',
    voluntaryNoticeDays: '',

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    acknowledgeConfidentiality: false,
    nonCompeteDuration: '',
    nonCompeteDurationOther: '',
    nonSolicitDuration: '',
    nonSolicitDurationOther: '',

    // Section 10: Final Details
    disputeResolution: '',
    disputeResolutionOther: '',
    governingLaw: '',
    amendmentProcess: '',
    amendmentProcessOther: '',
    reviewFrequencyMonths: '',
    acknowledgePeriodicReview: {},
    acknowledgeAmendmentReviewRequest: {},
    acknowledgeEntireAgreement: {},
    acknowledgeSeverability: {}
  });

  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [section3InResultsView, setSection3InResultsView] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Helper function to calculate fullMailingAddress
  const calculateFullMailingAddress = (addressData) => {
    const { mailingStreet, mailingStreet2, mailingCity, mailingState, mailingZip } = addressData;

    let fullAddress = '';
    if (mailingStreet) {
      fullAddress = mailingStreet;
      if (mailingStreet2) {
        fullAddress += '\n' + mailingStreet2;
      }
      if (mailingCity || mailingState || mailingZip) {
        fullAddress += '\n' + [mailingCity, mailingState, mailingZip].filter(Boolean).join(', ');
      }
    }
    return fullAddress;
  };

  // Set initial section when project changes - always start at Formation & Purpose
  useEffect(() => {
    setCurrentSection(1);
    setSection3InResultsView(false);
  }, [projectId]);


  // Reset section3InResultsView when leaving section 3
  useEffect(() => {
    if (currentSection !== 3) {
      setSection3InResultsView(false);
    }
  }, [currentSection]);

  // Show welcome popup on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${projectId}`);
    if (!hasSeenWelcome) {
      setShowWelcomePopup(true);
    }
  }, [projectId]);

  const dismissWelcomePopup = () => {
    setShowWelcomePopup(false);
    localStorage.setItem(`welcome_seen_${projectId}`, 'true');
  };


  // Listen to project changes
  useEffect(() => {
    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProject(data);

        if (!isSavingRef.current) {
          // Create initial blank form data
          const initialFormData = {
            // Section 1: Formation & Purpose
            companyName: '',
            entityType: '',
            entityTypeOther: '',
            registeredState: '',
            mailingStreet: '',
            mailingStreet2: '',
            mailingCity: '',
            mailingState: '',
            mailingZip: '',
            fullMailingAddress: '',
            companyDescription: '',
            industries: [],
            industryOther: '',

            // Section 2: Cofounder Info
            cofounderCount: '',
            cofounders: [],

            // Section 3: Equity Allocation
            finalEquityPercentages: {},
            acknowledgeEquityAllocation: {},
            equityCalculatorDraft: {},
            equityCalculatorSubmitted: {},

            // Section 4: Decision-Making & Voting
            majorDecisions: [],
            majorDecisionsOther: '',
            equityVotingPower: '',
            finalSayPerson: '',
            tieResolution: '',
            tieResolutionOther: '',
            acknowledgeTieResolution: {},
            includeShotgunClause: '',
            acknowledgeShotgunClause: {},

            // Section 5: Equity & Vesting
            vestingStartDate: '',
            vestingSchedule: '',
            vestingScheduleOther: '',
            cliffPercentage: '',
            accelerationTrigger: '',
            sharesSellNoticeDays: '',
            sharesBuybackDays: '',
            acknowledgeForfeiture: false,
            vestedSharesDisposal: '',

            // Section 6: IP & Ownership
            hasPreExistingIP: '',
            acknowledgeIPAssignment: false,
            acknowledgeIPOwnership: false,

            // Section 7: Compensation & Expenses
            takingCompensation: '',
            compensations: [],
            spendingLimit: '',

            // Section 8: Performance
            performanceConsequences: [],
            remedyPeriodDays: '',
            terminationWithCause: [],
            terminationWithCauseOther: '',
            voluntaryNoticeDays: '',

            // Section 9: Non-Competition
            acknowledgeConfidentiality: false,
            nonCompeteDuration: '',
            nonCompeteDurationOther: '',
            nonSolicitDuration: '',
            nonSolicitDurationOther: '',

            // Section 10: Final Details
            disputeResolution: '',
            disputeResolutionOther: '',
            governingLaw: '',
            amendmentProcess: '',
            amendmentProcessOther: '',
            reviewFrequencyMonths: '',
            acknowledgePeriodicReview: {},
            acknowledgeAmendmentReviewRequest: {},
            acknowledgeEntireAgreement: {},
            acknowledgeSeverability: {}
          };

          const loadedData = {
            ...initialFormData,
            ...(data.surveyData || {})
          };

          // Calculate fullMailingAddress if it doesn't exist (backwards compatibility)
          if (!loadedData.fullMailingAddress && loadedData.mailingStreet) {
            loadedData.fullMailingAddress = calculateFullMailingAddress(loadedData);
          }

          setFormData(loadedData);
        }

        // Set lastSaved from updatedAt if available
        if (data.updatedAt && !lastSaved) {
          setLastSaved(data.updatedAt.toDate());
        }
      }
    });

    return unsubscribe;
  }, [projectId]);


  // Auto-save function
  const saveFormData = async (dataToSave) => {
    if (!project) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const projectRef = doc(db, 'projects', projectId);

      // Clean and merge "Other" fields before saving
      const cleanedData = { ...dataToSave };

      // Merge "Other" array fields
      if (cleanedData.industries?.includes('Other') && cleanedData.industryOther) {
        cleanedData.industries = cleanedData.industries.map(item =>
          item === 'Other' ? cleanedData.industryOther : item
        );
      }
      if (cleanedData.majorDecisions?.includes('Other') && cleanedData.majorDecisionsOther) {
        cleanedData.majorDecisions = cleanedData.majorDecisions.map(item =>
          item === 'Other' ? cleanedData.majorDecisionsOther : item
        );
      }
      if (cleanedData.terminationWithCause?.includes('Other') && cleanedData.terminationWithCauseOther) {
        cleanedData.terminationWithCause = cleanedData.terminationWithCause.map(item =>
          item === 'Other' ? cleanedData.terminationWithCauseOther : item
        );
      }

      // Merge "Other" string fields
      if (cleanedData.entityType === 'Other' && cleanedData.entityTypeOther) {
        cleanedData.entityType = cleanedData.entityTypeOther;
      }
      if (cleanedData.tieResolution === 'Other' && cleanedData.tieResolutionOther) {
        cleanedData.tieResolution = cleanedData.tieResolutionOther;
      }
      if (cleanedData.vestingSchedule === 'Other' && cleanedData.vestingScheduleOther) {
        cleanedData.vestingSchedule = cleanedData.vestingScheduleOther;
      }
      if (cleanedData.nonCompeteDuration === 'Other' && cleanedData.nonCompeteDurationOther) {
        cleanedData.nonCompeteDuration = cleanedData.nonCompeteDurationOther;
      }
      if (cleanedData.nonSolicitDuration === 'Other' && cleanedData.nonSolicitDurationOther) {
        cleanedData.nonSolicitDuration = cleanedData.nonSolicitDurationOther;
      }
      if (cleanedData.disputeResolution === 'Other' && cleanedData.disputeResolutionOther) {
        cleanedData.disputeResolution = cleanedData.disputeResolutionOther;
      }
      if (cleanedData.amendmentProcess === 'Other' && cleanedData.amendmentProcessOther) {
        cleanedData.amendmentProcess = cleanedData.amendmentProcessOther;
      }

      // Remove all "*Other" fields after merging
      const otherFields = [
        'entityTypeOther', 'industryOther', 'majorDecisionsOther', 'tieResolutionOther', 'vestingScheduleOther',
        'nonCompeteDurationOther', 'nonSolicitDurationOther', 'terminationWithCauseOther',
        'disputeResolutionOther', 'amendmentProcessOther'
      ];
      otherFields.forEach(field => delete cleanedData[field]);

      // Check if there are actual changes
      const oldData = project.surveyData || {};
      const changedFields = Object.keys(cleanedData).filter(key => {
        return JSON.stringify(oldData[key]) !== JSON.stringify(cleanedData[key]);
      });

      const updateData = {
        surveyData: cleanedData,
        lastUpdated: serverTimestamp(),
        lastEditedBy: auth.currentUser.email
      };

      // Sync project name with company name
      if (cleanedData.companyName && cleanedData.companyName !== project.name) {
        updateData.name = cleanedData.companyName;
      }

      // Reset approvals only if there are actual changes
      if (changedFields.length > 0 && project.requiresApprovals) {
        updateData.approvals = {};
      }

      await updateDoc(projectRef, updateData);

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prevFormData => {
      const newFormData = {
        ...prevFormData,
        [field]: value
      };

      // Auto-update fullMailingAddress when any address field changes
      const addressFields = ['mailingStreet', 'mailingStreet2', 'mailingCity', 'mailingState', 'mailingZip'];
      if (addressFields.includes(field)) {
        newFormData.fullMailingAddress = calculateFullMailingAddress(newFormData);
      }

      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveFormData(newFormData);
      }, 2000);

      return newFormData;
    });
  };

  // Helper function to check if a field with "Other" option is properly filled
  const isOtherFieldValid = (value, otherValue) => {
    if (value === 'Other') {
      return otherValue && otherValue.trim() !== '';
    }
    return !!value;
  };

  // Helper function to check if an array field with "Other" option is properly filled
  const isOtherArrayFieldValid = (array, otherValue) => {
    if (!array || array.length === 0) return false;
    if (array.includes('Other')) {
      return otherValue && otherValue.trim() !== '';
    }
    return true;
  };

  // Calculate progress across all sections
  const calculateProgress = () => {
    let totalRequired = 0;
    let completed = 0;

    // Get all collaborators
    const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);

    // Section 1: Formation & Purpose
    if (formData.companyName) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.entityType, formData.entityTypeOther)) completed++;
    totalRequired++;
    if (formData.registeredState) completed++;
    totalRequired++;
    if (formData.mailingStreet) completed++;
    totalRequired++;
    if (formData.mailingCity) completed++;
    totalRequired++;
    if (formData.mailingState) completed++;
    totalRequired++;
    if (formData.mailingZip) completed++;
    totalRequired++;
    if (formData.companyDescription) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.industries, formData.industryOther)) completed++;
    totalRequired++;

    // Section 2: Cofounder Info
    if (formData.cofounderCount) completed++;
    totalRequired++;
    // Check if all cofounders have required fields
    if (formData.cofounders && formData.cofounders.length > 0) {
      const allCofoundersFilled = formData.cofounders.every(cf =>
        cf.fullName && cf.title && cf.email && cf.roles && cf.roles.length > 0
      );
      if (allCofoundersFilled) completed++;
      totalRequired++;
    }

    // Section 3: Equity Allocation
    if (formData.finalEquityPercentages && Object.keys(formData.finalEquityPercentages).length > 0) {
      const allPercentagesFilled = allCollaborators.every(email =>
        formData.finalEquityPercentages[email] && formData.finalEquityPercentages[email] !== ''
      );
      if (allPercentagesFilled) completed++;
      totalRequired++;

      const totalEquity = allCollaborators.reduce((sum, email) =>
        sum + (parseFloat(formData.finalEquityPercentages[email]) || 0), 0
      );
      if (Math.abs(totalEquity - 100) <= 0.01) completed++;
      totalRequired++;
    }
    const allAcknowledgedEquityAllocation = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]);
    if (allAcknowledgedEquityAllocation) completed++;
    totalRequired++;

    // Section 4: Decision-Making
    if (isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther)) completed++;
    totalRequired++;
    if (formData.equityVotingPower) completed++;
    totalRequired++;
    if (formData.finalSayPerson) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.tieResolution, formData.tieResolutionOther)) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged tie resolution
    const allAcknowledgedTieResolution = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
    if (allAcknowledgedTieResolution) completed++;
    totalRequired++;
    if (formData.includeShotgunClause) completed++;
    totalRequired++;
    if (formData.includeShotgunClause === 'Yes') {
      const allAcknowledgedShotgunClause = allCollaborators.length > 0 &&
        allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email]);
      if (allAcknowledgedShotgunClause) completed++;
      totalRequired++;
    }

    // Section 5: Equity & Vesting
    if (formData.vestingStartDate) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther)) completed++;
    totalRequired++;
    if (formData.cliffPercentage) completed++;
    totalRequired++;
    if (formData.accelerationTrigger) completed++;
    totalRequired++;
    if (formData.sharesSellNoticeDays) completed++;
    totalRequired++;
    if (formData.sharesBuybackDays) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged forfeiture
    const allAcknowledgedForfeiture = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
    if (allAcknowledgedForfeiture) completed++;
    totalRequired++;
    if (formData.vestedSharesDisposal) completed++;
    totalRequired++;

    // Section 6: IP & Ownership
    if (formData.hasPreExistingIP) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged IP ownership
    const allAcknowledgedIPOwnership = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
    if (allAcknowledgedIPOwnership) completed++;
    totalRequired++;

    // Section 7: Compensation
    if (formData.takingCompensation) completed++;
    totalRequired++;
    if (formData.spendingLimit) completed++;
    totalRequired++;

    // Section 8: Performance (Cofounder Performance & Departure)
    if (formData.performanceConsequences && formData.performanceConsequences.length > 0) completed++;
    totalRequired++;
    if (formData.remedyPeriodDays) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther)) completed++;
    totalRequired++;
    if (formData.voluntaryNoticeDays) completed++;
    totalRequired++;

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    // Check if all collaborators have acknowledged confidentiality
    const allAcknowledgedConfidentiality = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
    if (allAcknowledgedConfidentiality) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther)) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther)) completed++;
    totalRequired++;

    // Section 10: Final Details
    if (isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther)) completed++;
    totalRequired++;
    if (formData.governingLaw) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther)) completed++;
    totalRequired++;
    if (formData.reviewFrequencyMonths) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged periodic review
    const allAcknowledgedPeriodicReview = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
    if (allAcknowledgedPeriodicReview) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged amendment review request
    const allAcknowledgedAmendmentReviewRequest = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
    if (allAcknowledgedAmendmentReviewRequest) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged entire agreement
    const allAcknowledgedEntireAgreement = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
    if (allAcknowledgedEntireAgreement) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged severability
    const allAcknowledgedSeverability = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
    if (allAcknowledgedSeverability) completed++;
    totalRequired++;

    return Math.round((completed / totalRequired) * 100);
  };

  // Check if a specific section is completed
  const isSectionCompleted = (sectionId) => {
    const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);

    switch(sectionId) {
      case 1: // Formation & Purpose
        return formData.companyName &&
               isOtherFieldValid(formData.entityType, formData.entityTypeOther) &&
               formData.registeredState &&
               formData.mailingStreet && formData.mailingCity && formData.mailingState &&
               formData.mailingZip && formData.companyDescription &&
               isOtherArrayFieldValid(formData.industries, formData.industryOther);

      case 2: // Cofounder Info
        if (!formData.cofounderCount) return false;
        if (formData.cofounders && formData.cofounders.length > 0) {
          // Check that all cofounders have all required fields filled
          const allCofoundersFilled = formData.cofounders.every(cf =>
            cf.fullName && cf.title && cf.email &&
            cf.roles && cf.roles.length > 0
          );
          return allCofoundersFilled;
        }
        return true;

      case 3: // Equity Allocation
        // Check that all equity percentages are filled
        const allPercentagesFilled = allCollaborators.every(email =>
          formData.finalEquityPercentages?.[email] && formData.finalEquityPercentages[email] !== ''
        );
        if (!allPercentagesFilled) return false;

        // Check that total equity equals 100%
        const totalEquity = allCollaborators.reduce((sum, email) =>
          sum + (parseFloat(formData.finalEquityPercentages?.[email]) || 0), 0
        );
        if (Math.abs(totalEquity - 100) > 0.01) return false;

        // Check that all collaborators have acknowledged
        const allAcknowledgedEquityAllocation = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]);
        return allAcknowledgedEquityAllocation;

      case 4: // Vesting Schedule
        const allAcknowledgedForfeiture = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
        return formData.vestingStartDate &&
               isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther) &&
               formData.cliffPercentage && formData.accelerationTrigger &&
               formData.sharesSellNoticeDays && formData.sharesBuybackDays &&
               allAcknowledgedForfeiture && formData.vestedSharesDisposal;

      case 5: // Decision-Making
        const allAcknowledgedTieResolution = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
        const allAcknowledgedShotgunClause = formData.includeShotgunClause === 'Yes' ? (
          allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email])
        ) : true;
        return isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther) &&
               formData.equityVotingPower && formData.finalSayPerson &&
               isOtherFieldValid(formData.tieResolution, formData.tieResolutionOther) &&
               allAcknowledgedTieResolution &&
               formData.includeShotgunClause && allAcknowledgedShotgunClause;

      case 6: // IP & Ownership
        const allAcknowledgedIPOwnership = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
        return formData.hasPreExistingIP && allAcknowledgedIPOwnership;

      case 7: // Compensation
        return formData.takingCompensation && formData.spendingLimit;

      case 8: // Performance (Cofounder Performance & Departure)
        return formData.performanceConsequences && formData.performanceConsequences.length > 0 &&
               formData.remedyPeriodDays &&
               isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther) &&
               formData.voluntaryNoticeDays;

      case 9: // Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
        const allAcknowledgedConfidentiality = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
        return allAcknowledgedConfidentiality &&
               isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther) &&
               isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther);

      case 10: // Final Details
        const allAcknowledgedPeriodicReview = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
        const allAcknowledgedAmendmentReviewRequest = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
        const allAcknowledgedEntireAgreement = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
        const allAcknowledgedSeverability = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
        return isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther) &&
               formData.governingLaw &&
               isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther) &&
               formData.reviewFrequencyMonths &&
               allAcknowledgedPeriodicReview && allAcknowledgedAmendmentReviewRequest &&
               allAcknowledgedEntireAgreement && allAcknowledgedSeverability;

      default:
        return false;
    }
  };

  const isReadOnly = project?.submitted;

  // Find first incomplete section
  const findFirstIncompleteSection = () => {
    for (let sectionId = 1; sectionId <= 10; sectionId++) {
      if (!isSectionCompleted(sectionId)) {
        return sectionId;
      }
    }
    return null;
  };

  // Handle preview/submit click
  const handlePreviewClick = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      await saveFormData(formData);
    }
    if (saveStatus === 'saving') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check if all sections are complete
    const firstIncompleteSection = findFirstIncompleteSection();
    if (firstIncompleteSection) {
      setShowValidation(true);
      // Simulate clicking the section button
      const sectionButton = document.querySelector(`[data-section-id="${firstIncompleteSection}"]`);
      if (sectionButton) {
        sectionButton.click();
      }

      // After section loads, scroll to first validation error
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-700, .validation-error');
        if (firstError) {
          // Find the closest parent question container
          const questionContainer = firstError.closest('div');
          if (questionContainer) {
            questionContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } else {
      onPreview();
    }
  };

  // Search data mapping sections to their questions and keywords
  const SEARCH_DATA = [
    {
      id: 1,
      name: 'Formation & Purpose',
      questions: [
        "What's your company's name?",
        "What type of entity is it?",
        "What state will your company be registered in?",
        "What's your company mailing address?",
        "Can you describe your company in 1 line?",
        "What industry is it in?"
      ]
    },
    {
      id: 2,
      name: 'Cofounder Info',
      questions: [
        "Full Name",
        "Title",
        "Email",
        "Roles & Responsibilities"
      ]
    },
    {
      id: 3,
      name: 'Equity Allocation',
      questions: [
        "Individual Assessments",
        "equity ownership",
        "equity split",
        "ownership percentage"
      ]
    },
    {
      id: 4,
      name: 'Vesting Schedule',
      questions: [
        "What date should the vesting start?",
        "What vesting schedule will you use?",
        "What percent of equity will be vested once the cliff is complete?",
        "Should unvested shares accelerate if the cofounder is terminated and the company is acquired?",
        "If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?",
        "If a cofounder resigns, how many days does the company have to buy back the shares?",
        "You acknowledge that if a cofounder dies, becomes permanently disabled, or is otherwise incapacitated, their unvested shares are automatically forfeited and returned to the company",
        "If a cofounder dies, becomes permanently disabled, or is otherwise incapacitated"
      ]
    },
    {
      id: 5,
      name: 'Decision-Making',
      questions: [
        "Should equity ownership reflect voting power?",
        "Who has final say, regardless of their field of expertise?",
        "If cofounders are deadlocked, how should the tie be resolved?",
        "Do you want to include a shotgun clause if you and your cofounder(s) cannot resolve deadlocks?"
      ]
    },
    {
      id: 6,
      name: 'IP & Ownership',
      questions: [
        "Has any cofounder created code, designs, or other assets before the company was formed that will now be used in the business?",
        "intellectual property assignment",
        "IP ownership"
      ]
    },
    {
      id: 7,
      name: 'Compensation',
      questions: [
        "Are any cofounders currently taking compensation or salary from the company?",
        "Compensation Details",
        "Compensation (USD/year)",
        "What's the spending limit, in USD, before a cofounder needs to check with other cofounders?"
      ]
    },
    {
      id: 8,
      name: 'Performance',
      questions: [
        "What happens if a cofounder fails to meet their agreed-upon obligations (e.g., time commitment, role performance, or deliverables)?",
        "How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?",
        "Which of the following constitutes termination with cause?",
        "How many days is the notice period if a Cofounder wishes to voluntarily leave?"
      ]
    },
    {
      id: 9,
      name: 'Non-Competition',
      questions: [
        "How long should the non-competition obligation last after a cofounder leaves?",
        "How long should the non-solicitation obligation last after a cofounder leaves?",
        "non-compete agreement",
        "confidentiality"
      ]
    },
    {
      id: 10,
      name: 'Final Details',
      questions: [
        "How should disputes among cofounders be resolved?",
        "Which state's laws will govern this agreement?",
        "How can this agreement be amended or modified?",
        "How often (in months) should this agreement be reviewed by the cofounders?"
      ]
    }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    SEARCH_DATA.forEach(section => {
      const sectionNameMatches = section.name.toLowerCase().includes(lowerQuery);
      const matchingQuestions = section.questions.filter(q =>
        q.toLowerCase().includes(lowerQuery)
      );

      // If section name matches, add the section itself
      if (sectionNameMatches && matchingQuestions.length === 0) {
        results.push({
          id: section.id,
          name: section.name,
          type: 'section'
        });
      }

      // Add each matching question as a separate result
      matchingQuestions.forEach(question => {
        results.push({
          id: section.id,
          name: section.name,
          question: question,
          type: 'question'
        });
      });
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (sectionId) => {
    setCurrentSection(sectionId);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={dismissWelcomePopup} />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-8 pointer-events-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Welcome to Your Cofounder Agreement
              </h2>

              <div className="space-y-5 mb-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Invite your cofounders</h3>
                    <p className="text-sm text-gray-600">
                      Add your cofounders as collaborators. They must be added to be included in the Cofounder Agreement.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Collab on the agreement</h3>
                    <p className="text-sm text-gray-600">
                      You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Do a final review</h3>
                    <p className="text-sm text-gray-600">
                      We take your responses and turn them into a Cofounder Agreement, ready for your final review and signature.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={dismissWelcomePopup}
                  className="next-button bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center gap-4" style={{ zIndex: 50, paddingLeft: '270px' }}>
        {/* Search Bar */}
        <div className="flex-1 flex justify-center items-center">
        <div className="max-w-lg w-full relative" style={{ maxWidth: '512px' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={(e) => {
                if (searchQuery) setShowSearchResults(true);
                e.target.style.backgroundColor = '#E5E7EB';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#F3F4F6';
                setTimeout(() => setShowSearchResults(false), 200);
              }}
              className="w-full text-sm transition text-gray-500 placeholder-gray-500"
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '0.5rem',
                border: 'none',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-[9999]">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  onClick={() => handleSearchResultClick(result.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition text-sm border-b border-gray-100 last:border-b-0"
                >
                  {result.type === 'section' ? (
                    <span className="font-medium text-gray-900">{result.name}</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900">{result.question}</span>
                      <span className="text-xs text-gray-500">{result.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]">
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          )}
        </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-4 pr-6 relative">
          {/* Add Collaborators Button */}
          <button
            onClick={() => setShowCollaborators(true)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-[#1a1a1a] transition flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium">Add Collaborators</span>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <SurveyNavigation
        displayTitle={project?.name || 'Loading...'}
        currentPage="survey"
        projectId={projectId}
        allProjects={allProjects}
        onProjectSwitch={onProjectSwitch}
        onCreateProject={onCreateProject}
      >

        {/* Progress Bar */}
        <div className="px-3 pb-2">
          <div className="px-3" style={{ width: '90%' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Progress</span>
              <span className="text-xs font-medium text-gray-600">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-black h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
          <div className="mt-2 px-3" style={{ width: '90%', height: '24px', display: 'flex', alignItems: 'center' }}>
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <span className="text-xs text-gray-500">
                Saved at {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-950">Error saving</span>
            )}
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto pb-3 px-1 pt-4 flex flex-col">
          <div>
          <div className="px-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Sections</span>
          </div>
          {SECTIONS.filter(section => section.id !== 0).map((section) => {
            const isCompleted = isSectionCompleted(section.id);
            return (
              <button
                key={section.id}
                data-section-id={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center justify-between ${
                  currentSection === section.id
                    ? 'text-black font-semibold'
                    : 'text-gray-600'
                }`}
                style={{ width: '100%', fontSize: '15px' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-6 h-6 ${
                    currentSection === section.id
                      ? 'font-medium'
                      : isCompleted
                        ? ''
                        : ''
                  } text-gray-500`} style={{ fontSize: '15px' }}>
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shape-rendering="geometricPrecision"/>
                      </svg>
                    ) : section.id === 0 ? (
                      <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shape-rendering="geometricPrecision"/>
                      </svg>
                    ) : (
                      section.id
                    )}
                  </span>
                  <span className="nav-link-underline">{section.name}</span>
                </div>
              </button>
            );
          })}
          </div>
        </div>

      </SurveyNavigation>

      {/* Collaborators Modal */}
      {showCollaborators && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
            onClick={() => setShowCollaborators(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 w-full max-w-lg" style={{ zIndex: 10001 }}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900">Collaborators</h3>
                <button
                  onClick={() => setShowCollaborators(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CollaboratorManager project={{ ...project, id: projectId }} />
            </div>
          </div>
        </>
      )}


      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ marginLeft: '270px', marginTop: '64px', backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto pt-6 px-6 pr-12 pb-20" key={currentSection}>
          {/* Content Container */}
          <div className="px-20 pt-8 pb-8">
          {/* Section Content */}
          {currentSection === 1 && (
            <div className="animate-fade-down">
              {isLoaded ? (
                <Section1Formation
                  formData={formData}
                  handleChange={handleChange}
                  isReadOnly={isReadOnly}
                  showValidation={showValidation}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading...</p>
                </div>
              )}
            </div>
          )}
          {currentSection === 2 && (
            <div className="animate-fade-down">
              <Section2Cofounders
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            </div>
          )}
          {currentSection === 3 && (
            <div className="animate-fade-down">
              <Section3EquityAllocation
                ref={section3Ref}
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
                onViewModeChange={setSection3InResultsView}
              />
            </div>
          )}
          {currentSection === 4 && (
            <div className="animate-fade-down">
              <Section5EquityVesting
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 5 && (
            <div className="animate-fade-down">
              <Section4DecisionMaking
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 6 && (
            <div className="animate-fade-down">
              <Section6IP
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 7 && (
            <div className="animate-fade-down">
              <Section7Compensation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 8 && (
            <div className="animate-fade-down">
              <Section8Performance
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 9 && (
            <div className="animate-fade-down">
              <Section9NonCompete
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 10 && (
            <div className="animate-fade-down">
              <Section10Final
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}

          {/* Next Button */}
          {!isReadOnly && (
            <div className={`mt-16 flex justify-between`}>
              {currentSection > 1 && (
                <button
                  onClick={() => {
                    // If on section 3 in results view, go back to edit view (spreadsheet)
                    if (currentSection === 3 && section3InResultsView && section3Ref.current) {
                      section3Ref.current.backToEdit();
                    } else {
                      setCurrentSection(Math.max(1, currentSection - 1));
                    }
                  }}
                  className="pr-6 py-3 text-gray-400 hover:text-gray-600 font-medium flex items-center gap-2"
                >
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8L2 8M2 8L8 2M2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Previous
                </button>
              )}
              {currentSection === 1 && <div />}

              {currentSection < 10 ? (
                <button
                  onClick={() => {
                    // If on section 3 (Equity Allocation)
                    if (currentSection === 3) {
                      // If in results view, proceed to next section
                      if (section3InResultsView) {
                        setCurrentSection(4);
                        return;
                      }
                      // If in edit view, submit the calculator first
                      if (section3Ref.current) {
                        const submitted = section3Ref.current.submitEquityCalculator();
                        // Only proceed if submission was successful
                        if (submitted === false) {
                          // Submission failed validation, stay on this section
                          return;
                        }
                        // Don't move to next section - the submit will show results view
                        return;
                      }
                    }
                    // For other sections, proceed normally
                    setCurrentSection(currentSection + 1);
                  }}
                  className="next-button bg-black text-white px-7 py-2 rounded font-normal hover:bg-[#1a1a1a] transition flex items-center gap-2"
                >
                  Next
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePreviewClick}
                  disabled={saveStatus === 'saving'}
                  className="next-button bg-black text-white px-10 py-2 rounded font-normal hover:bg-[#1a1a1a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Preview & Approve
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}
          </div>
          {/* End White Card Container */}
        </div>
      </div>
    </div>
  );
}

export default Survey;
